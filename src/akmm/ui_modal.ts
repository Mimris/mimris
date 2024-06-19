// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;

import * as akm from '../akmm/metamodeller';
import * as jsn from './ui_json';
import * as uic from './ui_common';
import * as uid from './ui_diagram';
import * as uit from './ui_templates';
import * as gjs from './ui_gojs';
const utils = require('./utilities');
import * as constants from './constants';
import { filter } from 'cheerio/lib/api/traversing';
const RegexParser = require("regex-parser");


export function handleInputChange(myMetis: akm.cxMetis, props: any, value: string) {
  const propname = props.id;
  const fieldType = props.type;
  const obj = props.obj;

  const context = props.context;
  const pattern = props.pattern;
  // const myDiagram = context.myDiagram;
  let inst, instview, typeview, myInst, myInstview, myTypeview, myItem;
  // Handle object types
  if (obj.category === constants.gojs.C_OBJECTTYPE) {
    const node = obj; 
    inst = node.objecttype;
    typeview = node.typeview;

    if (context?.what === "editType") {
      myItem = inst;
    } else if (context?.what === "editTypeview") {
        myItem = typeview; 
    }    

    try {
        myItem[propname] = value;
      } catch {
        // Do nothing
    }
  }
    // Handle objects
  if (obj.category === constants.gojs.C_OBJECT) {
    const node = obj; 
    instview = myMetis.findObjectView(node?.key);
    myInst = myMetis.findObject(instview.objectRef);
    if (!myInst) myInst = obj;
    myInstview = instview //myMetis.findObjectView(instview?.id);
    typeview = myInst?.type?.typeview;
    if (context?.what === "editObjectview") {
        if (myInstview) {
          myItem = myInstview;
          for (let prop in typeview?.data) {
            myItem[prop] = obj[prop];
          }
        }
    } else if (context?.what === "editTypeview") {
        myItem = myInst.type?.typeview; 
    } else {
        myItem = myInst;
    }
    try {
      myItem[propname] = value;
    } catch {
      // Do nothing
    }
  }

  // Handle relationship types
  if (obj.category === constants.gojs.C_RELSHIPTYPE) {
    const link = obj;
    inst = link.reltype;
    typeview = link.reltype.typeview;

    if (context?.what === "editType") {
      myItem = inst;
    } else if (context?.what === "editTypeview") {
        myItem = typeview; 
        myTypeview = myMetis.findRelationshipTypeView(typeview?.id);    
    } 
    try {
      myItem[propname] = value;
      myTypeview[propname] = value;
    } catch {
      // Do nothing
    }
  }
  // Handle relationships
  if (obj.category === constants.gojs.C_RELATIONSHIP) {
      const link = obj;
      let myRelview: akm.cxRelationshipView = myMetis.findRelationshipView(link?.key);    
      let myRelship: akm.cxRelationship = myRelview?.relship;
      if (!myRelship) myRelship = obj;
      let myTypeview: akm.cxRelationshipTypeView = myRelview?.typeview;
      if (context?.what === "editRelshipview") 
          myItem = myRelview;
      else if (context?.what === "editTypeview") {
          myItem = myTypeview;
      } else // editRelship
          myItem = myRelship;
      if (myItem) 
          myItem[propname] = value;
  }
}

export function handleSelectDropdownChange(selected, context) {
  const myDiagram = context.myDiagram;
  const myMetis = context.myMetis as akm.cxMetis;
  const myMetamodel: akm.cxMetaModel = context.myMetamodel;
  const myGoModel: gjs.goModel = context.myGoModel;
  const myModel: akm.cxModel = context.myModel;
  const myModelview: akm.cxModelView = context.myModelview;
  const modalContext = context.modalContext;
  modalContext.selected = selected;
  modalContext.myMetamodel = myMetamodel;
  const selectedOption = selected.value;
  const objectview = modalContext.objectview;
  switch(modalContext.case) {
    case "Change Object type": {
      const typename = (selectedOption) && selectedOption;
      const objtype = myMetis.findObjectTypeByName(typename);
      myDiagram.selection.each(function(sel) {
        const gjsInst = sel.data;
        if (gjsInst.category === constants.gojs.C_OBJECT) {
          const goNode: gjs.goObjectNode = myGoModel.findNodeByViewId(gjsInst.key);
          let object: akm.cxObject = goNode?.object;
          uic.setObjectType(gjsInst, objtype, context);
          const n = myDiagram.findNodeForKey(gjsInst.key);
          myDiagram.model.setDataProperty(n.data, "typename", typename);
          uid.resetToTypeview(gjsInst, myMetis, myDiagram);
          if (n) n.isSelected = false;
          myMetis.myDiagram.requestUpdate();
        }
      });
      break;
    }
    case "Change Icon": {
      const icon = (selectedOption) && selectedOption;
      const instances = [];
      myDiagram.selection.each(function(sel) {
        const inst = sel.data;
        if (inst) instances.push(inst);
      });
      if (instances.length === 0) {
        instances.push(modalContext.currentNode);
      }
      instances.map(inst => {
        if (inst.category === constants.gojs.C_OBJECT) {
          let objview = inst.objectview;
          const icn = myDiagram.findNodeForKey(inst.key);
          const idata = icn.data;
          myDiagram.model.setDataProperty(idata, "icon", icon);
          myDiagram.requestUpdate();
          if (objview) {
            objview = myMetis.findObjectView(objview.id);
            objview.icon = icon;
            const jsnObjview = new jsn.jsnObjectView(objview);
            const modifiedObjviews = [];
            modifiedObjviews.push(jsnObjview);
            modifiedObjviews.map(mn => {
              let data = mn;
              data = JSON.parse(JSON.stringify(data));
              myMetis.myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
            });
          }
          const node = myDiagram.findNodeForKey(inst.key)
          if (node) node.isSelected = false;
        }
        else if (inst.category === constants.gojs.C_OBJECTTYPE) {
          let node = myMetis.currentNode;
          const icn = myDiagram.findNodeForKey(node.key);
          let idata = icn.data;
          myDiagram.model.setDataProperty(idata, "icon", icon);
          myDiagram.requestUpdate();
          let objtypeview = node.typeview;
          objtypeview = myMetis.findObjectTypeView(objtypeview?.id);
          myDiagram.model.setDataProperty(node, "icon", icon);
          if (objtypeview) {
            objtypeview.icon = icon;
            objtypeview.data.icon = icon;
            const jsnObjtypeview = new jsn.jsnObjectTypeView(objtypeview);
            const modifiedObjtypeviews = [];
            modifiedObjtypeviews.push(jsnObjtypeview);
            modifiedObjtypeviews.map(mn => {
              let data = mn;
              data = JSON.parse(JSON.stringify(data));
              myDiagram.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
            });
          }
          myDiagram.requestUpdate();
        }
      });
      break;
    } 
    case "Set Layout Scheme": {
      let item: akm.cxMetaModel | akm.cxModelView = myModelview; 
      const metamodelling = myMetis.modelType === 'Metamodelling';
      if (metamodelling)
        item = myMetamodel;
      if (!item) 
        break;
      const layout = (selectedOption) && selectedOption;
      if (objectview) {
        objectview.groupLayout = layout;
        const jsnObjview = new jsn.jsnObjectView(objectview);
        const modifiedObjviews = [];
        modifiedObjviews.push(jsnObjview);
        modifiedObjviews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          myMetis.myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
        });
      } else
      if (!metamodelling) {
        myModelview.layout = layout;
        const modifiedModelviews = new Array();
        const jsnModelview = new jsn.jsnModelView(myModelview);
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        })
      } else {
        myMetamodel.layout = layout;
        const modifiedMetamodels = new Array();
        const jsnMetamodel = new jsn.jsnMetaModel(myMetamodel, true);
        modifiedMetamodels.push(jsnMetamodel);
        modifiedMetamodels.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          myMetis.myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data })
        })
      }
      break;
    }
    case "Set Routing Scheme": { 
      let item: akm.cxMetaModel | akm.cxModelView = myModelview; 
      const metamodelling = myMetis.modelType === 'Metamodelling';
      if (metamodelling)
        item = myMetamodel;
      if (!item) 
        break;
      const routing = (selectedOption) && selectedOption;
      if (!metamodelling) {
        myModelview.routing = routing;
        const modifiedModelviews = new Array();
        const jsnModelview = new jsn.jsnModelView(myModelview);
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        })
      } else {
        myMetamodel.routing = routing;
        const modifiedMetamodels = new Array();
        const jsnMetamodel = new jsn.jsnMetaModel(myMetamodel, true);
        modifiedMetamodels.push(jsnMetamodel);
        modifiedMetamodels.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          myMetis.myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data })
        })
      }
      break;
    }
    case "Set Link Curve": {  
      let item: akm.cxMetaModel | akm.cxModelView = myModelview; 
      const metamodelling = myMetis.modelType === 'Metamodelling';
      if (metamodelling)
        item = myMetamodel;
      if (!item) 
        break;
      const linkcurve = (selectedOption) && selectedOption;
      if (!metamodelling) {
        myModelview.linkcurve = linkcurve;
        const modifiedModelviews = new Array();
        const jsnModelview = new jsn.jsnModelView(myModelview);
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        })
      } else {
        myMetamodel.linkcurve = linkcurve;
        const modifiedMetamodels = new Array();
        const jsnMetamodel = new jsn.jsnMetaModel(myMetamodel, true);
        modifiedMetamodels.push(jsnMetamodel);
        modifiedMetamodels.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          myMetis.myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data })
        })
      }
      break;
    }
    case "New Model": {
      const refMetamodelName = (selectedOption) && selectedOption;
      const refMetamodel = myMetis.findMetamodelByName(refMetamodelName);
      break;
    } 
    case "Set Target Model": { 
      const modelName = (selectedOption) && selectedOption;
      const targetModel = myMetis.findModelByName(modelName);
      myMetis.currentTargetModel = targetModel
      myMetis.currentModel.targetModelRef = targetModel.id
      let mdata = new jsn.jsnModel(myMetis.currentModel, true);
      mdata = JSON.parse(JSON.stringify(mdata));
      myMetis.myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: mdata })
      break;
    }
    case "Set Target Metamodel":   
    case "Generate Target Metamodel": {
      const metamodelName = (selectedOption) && selectedOption;
      let targetMetamodel = myMetis.findMetamodelByName(metamodelName);
      if (!targetMetamodel) {
        targetMetamodel = new akm.cxMetaModel(utils.createGuid(), metamodelName);
        myMetis.addMetamodel(targetMetamodel);
      }
      // myMetis.currentTargetMetamodel = targetMetamodel;
      myMetis.currentModel.targetMetamodelRef = targetMetamodel?.id
      let mmdata = new jsn.jsnModel(myMetis.currentModel, true);
      mmdata = JSON.parse(JSON.stringify(mmdata));
      myMetis.myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: mmdata });
      break;
    }
    case "Change Relationship type": { 
      const typename = (selectedOption) && selectedOption;
      myDiagram.selection.each(function(sel) {
        const link = sel.data;
        if (link.category === constants.gojs.C_RELATIONSHIP) {
          if (!link) return;
          const relshipRef = link.relshipRef;
          let relship = myModel.findRelationship(relshipRef);
          let fromNode = link.fromNode;
          let toNode   = link.toNode;
          let fromType = fromNode?.objecttype;
          let toType   = toNode?.objecttype;
          fromType = myMetis.findObjectType(fromType?.id);
          toType   = myMetis.findObjectType(toType?.id);
          const reltype = myMetis.findRelationshipTypeByName2(typename, fromType, toType);
          const relshipkind = reltype?.relshipkind;
          relship.setRelshipKind(relshipkind);
          switch(relshipkind) {
            case 'Composition':
            case 'Aggregation':
              relship.cardinalityFrom = reltype.cardinalityFrom;
              relship.cardinalityTo = reltype.cardinalityTo;
          }
          const relview = (reltype) && uic.setRelationshipType(link, reltype, context);
          uid.resetToTypeview(link, myMetis, myDiagram);
          myMetis.myDiagram.requestUpdate();        
        }
      });
      break;
    }
    case "Edit Attribute": {
      const propname = selected.value;
      if (propname && propname.length > 0) {
        const node = myMetis.currentNode;
        const link = myMetis.currentLink;
        let inst = null;
        let defValue = "";
        if (node) {
          inst = node?.object;
        } else {
          inst = link?.relship;
          if (!inst) {
              inst = link?.reltype;
          }
        }
        if (!inst) 
            break;
        defValue = inst[propname];
        const value = prompt('Enter value of ' + propname, defValue);
        if (value) {
          if (propname === 'description') {
            inst.description = value;
          } else {
            inst[propname] = value;
          }
          switch(inst.category) {
          case 'Relationship':
            inst = myMetis.findRelationship(inst.id);
            inst[propname] = value;
            const modifiedRelships = new Array();
            const jsnRel = new jsn.jsnRelationship(inst);
            modifiedRelships.push(jsnRel);
            modifiedRelships?.map(mn => {
              let data = (mn) && mn
              data = JSON.parse(JSON.stringify(data));
              myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
            });
            break;
          case 'Relationship type':
            inst = myMetis.findRelationshipType(inst.id);
            if (propname === 'cardinalityFrom' || propname === 'cardinalityTo') {
              const patt = '\\b(n|[0-9])\\b[-]\\b(n|[1-9])\\b';
              const regex = new RegexParser(patt);
              if (!regex.test(value)) {
                alert('Value: ' + value + ' IS NOT valid');
                break;
              }
            }
            inst[propname] = value;
            const modifiedReltypes = new Array();
            const jsnRelType = new jsn.jsnRelationshipType(inst, true);
            modifiedReltypes.push(jsnRelType);
            modifiedReltypes?.map(mn => {
              let data = (mn) && mn
              data = JSON.parse(JSON.stringify(data));
              myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
            });
            break;
          }
        }
      }
      break;
    }
    case "Create Relationship": {
      const myMetamodel = context.myMetamodel;
      const myGoModel = context.myGoModel;
      const myDiagram = context.myDiagram;
      const modalContext = context.modalContext;
      // const data = modalContext.data;
      const typename = selected.value;
      modalContext.typename = typename;
      let fromNode = myGoModel.findNode(modalContext.gjsFromNode);
      if (!fromNode) fromNode = myGoModel.findNode(modalContext.gjsFromNode.key);
      const fromPortId = modalContext.portFrom;
      let toNode = myGoModel.findNode(modalContext.gjsToNode);
      if (!toNode) toNode = myGoModel.findNode(modalContext.gjsToNode.key);
      const toPortId = modalContext.portTo;
      let fromType = modalContext.fromType; 
      if (!fromType) fromType = myMetamodel.findObjectType(fromNode?.object?.typeRef);
      if (fromType) {
          fromType.allObjecttypes = myMetamodel.objecttypes;
          fromType.allRelationshiptypes = myMetamodel.relshiptypes;
      }
      let toType   = modalContext.toType; 
      if (!toType) toType = myMetamodel.findObjectType(toNode?.object?.typeRef);
      if (toType) {
          toType.allObjecttypes = myMetamodel.objecttypes;
          toType.allRelationshiptypes = myMetamodel.relshiptypes;
      }
      let reltype = myMetamodel.findRelationshipTypeByName2(typename, fromType, toType);
      if (reltype) {
        let reltypeview = reltype.typeview;
        if (reltypeview) {
          const modifiedLinkTypeViews = new Array();
          const jsnTypeView = new jsn.jsnRelshipTypeView(reltypeview);
          modifiedLinkTypeViews.push(jsnTypeView);
          modifiedLinkTypeViews?.map(mn => {
            let data = (mn) && mn
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
          })
        }
      }
      context.relshiptype = reltype;
      break;
    }
    default:
      break;
  }
}

function removeClassInstances(selected: any) {
  selected.objectview = null;
  selected.object = null;
  selected.objecttype = null;
  selected.typeview = null;
  selected.leftPorts = null;
  selected.rightPorts = null;
  selected.topPorts = null;
  selected.bottomPorts = null;
  selected.relshipview = null;
  selected.relship = null;
  selected.relshiptype = null;
  selected.typeview = null;
  selected.fromNode = null;
  selected.toNode = null;
}

export function handleCloseModal(selectedData: any, props: any, modalContext: any) {
  const what = modalContext.what;
  let myDiagram = modalContext.myDiagram;
  if (myDiagram && modalContext.context) myDiagram = modalContext.context.myDiagram;
  const selection = myDiagram.selection;
  const myMetis = props.myMetis as akm.cxMetis;
  const myMetamodel = myMetis.currentMetamodel;
  const myModel     = myMetis.currentModel;
  const myModelview = myMetis.currentModelview;
  const myGoModel   = myMetis.gojsModel;
  // Prepare for dispatches
  const modifiedObjtypes     = new Array();    
  const modifiedReltypes     = new Array();    
  const modifiedObjTypeviews = new Array();    
  const modifiedRelTypeviews = new Array();    
  const modifiedObjviews     = new Array();    
  const modifiedRelviews     = new Array();    
  const modifiedObjects      = new Array();    
  const modifiedRelships     = new Array();    
  // const modifiedModels       = new Array();    
  const modifiedModelviews   = new Array();    
  switch(what) {
    case "editObjectType": {
      // To be done !!!

      // selObj is a node representing an objecttype
      const selObj = selectedData;
      const node = myDiagram.findNodeForKey(selObj.key);
      if (node) node.isSelected = true;
      let type = selObj.objecttype;
      type = myMetis.findObjectType(type.id);
      const data = node.data;
      for (let k in type) {
        if (k === 'id') continue;
        if (typeof(type[k]) === 'object')    continue;
        if (typeof(type[k]) === 'function')  continue;
        if (!uic.isPropIncluded(k, type))    continue;
        type[k] = selObj[k];
        myDiagram.model.setDataProperty(data, k, type[k]);
      }
      if (node) node.isSelected = false;
      // Do the dispatches
      const jsnObjtype = new jsn.jsnObjectType(type, true);
      modifiedObjtypes.push(jsnObjtype);
      modifiedObjtypes.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
      })
      break;
    }
    case "editRelationshipType": {
      // To be done !!!
      
      // selObj is a link representing a relationship type
      const rel = selectedData;
      let link = myDiagram.findLinkForKey(rel.key);
      if (!link)
          break;
      let type = rel.type;
      const data = link.data;
      type = link.relshiptype;
      if (!type) type = data.relshiptype;
      type = myMetis.findRelationshipType(type?.id);
      const reltypeview = type?.typeview;
      if (type) {
        const cardinalityFrom = type.getCardinalityFrom();
        const cardinalityTo = type.getCardinalityTo();
        type.cardinalityFrom = cardinalityFrom;
        type.cardinalityTo = cardinalityTo;
        if (reltypeview) {
          reltypeview.setRelshipKind(type.relshipkind);
          reltypeview.setTemplate(data.template);
        }
      } else 
        break;

      for (let k in selObj) {
        if (typeof(type[k]) === 'object')    continue;
        if (typeof(type[k]) === 'function')  continue;
        if (!uic.isPropIncluded(k, type))    continue;
        type[k] = selObj[k];
        myDiagram.model.setDataProperty(link.data, k, type[k]);
      }
      // Do the dispatches
      const jsnReltype = new jsn.jsnRelationshipType(type, true);
      modifiedReltypes.push(jsnReltype);
      modifiedReltypes.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
      })
      break;
    }
    case "editPort": {
      // selObj is a node representing an object with ports
      const selObj = selectedData;
      const node = myDiagram.findNodeForKey(selObj.key);
      if (node) node.isSelected = true;

      break;
    }
    case "editObject": {
      // selObj is a node representing an object or an objectview
      const selObj = selectedData;
      const goNode = myGoModel.findNodeByViewId(selObj.key);
      const objview = myModelview.findObjectView(selObj.key);
      uid.updateNodeAndView(selObj, goNode, objview, myDiagram);
      // Dispatch
      let object = objview.object;
      if (!object) object = myMetis.findObject(objview.objectRef);
      if (object) {
        const jsnObj = new jsn.jsnObject(object);
        let data = JSON.parse(JSON.stringify(jsnObj));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
      }
      const jsnObjview = new jsn.jsnObjectView(objview);
      let data = JSON.parse(JSON.stringify(jsnObjview));
      myMetis.myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
      break;
    }
    case "addPort": {
      const selObj = selectedData;
      break;
    }
    case "editRelationship": {
      // selRel is a link representing a relationship or a relationship view
      const selRel = selectedData;
      const gjsLink = myDiagram.findLinkForKey(selRel.key);
      if (!gjsLink)
        break;
      if (gjsLink) gjsLink.isSelected = true;
      const gjsData = gjsLink.data;
      const goLink = myGoModel.findLinkByViewId(selRel.key);
      const relview = myModelview.findRelationshipView(selRel.key);
      let relship = relview.relship;
      const reltype = relship.type;
      relship['cardinalityFrom'] = relship.getCardinalityFrom();
      relship['cardinalityTo'] = relship.getCardinalityTo();
      if (relship.name === "") relship.name = " ";
      const rel = selRel;
      for (let k in rel) {
        if (typeof(rel[k]) === 'object')    continue;
        if (typeof(rel[k]) === 'function')  continue;
        if (!uic.isPropIncluded(k, reltype))  continue;
        if (k === constants.props.DRAFT) {
          myDiagram.model.setDataProperty(gjsData, 'name', rel[k]);
        }
        myDiagram.model.setDataProperty(gjsData, k, relship[k]);
      }
      if (relship.name === 'Is') {
        // relview['fromArrow'] = 'None';
        // relview['toArrow'] = 'Triangle';
        relship.relshipkind = 'Generalization';
      }
      if (relship.relshipkind !== constants.relkinds.REL) {
        relview.setFromArrow2(relship.relshipkind);
        relview.setToArrow2(relship.relshipkind);
        let fromArrow = relview.fromArrow;
        if (fromArrow === "None") fromArrow = "";
        let toArrow = relview.toArrow;
        if (toArrow === "None") toArrow = "";
        myDiagram.model.setDataProperty(gjsData, 'fromArrow', fromArrow);
        myDiagram.model.setDataProperty(gjsData, 'toArrow', toArrow);
        myDiagram.model.setDataProperty(gjsData, 'fromArrowColor', relview.fromArrowColor);
        myDiagram.model.setDataProperty(gjsData, 'toArrowColor', relview.toArrowColor);
      }
      if (myModelview.showCardinality) {
        myDiagram.model.setDataProperty(gjsData, 'cardinalityFrom', relship.getCardinalityFrom());
        myDiagram.model.setDataProperty(gjsData, 'cardinalityTo', relship.getCardinalityTo());
      } else {
        myDiagram.model.setDataProperty(gjsData, 'cardinalityFrom', '');
        myDiagram.model.setDataProperty(gjsData, 'cardinalityTo', '');
      }






      // Dispatch
      const jsnRelview = new jsn.jsnRelshipView(relview);
      let data = JSON.parse(JSON.stringify(jsnRelview));
      myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      break;
    }
    case "editObjectview": {
      // selObj is a node representing an object or an objectview
      const selObj = selectedData;
      const goNode = myGoModel.findNodeByViewId(selObj.key);
      const objview = myModelview.findObjectView(selObj.key);
      uid.updateNodeAndView(selObj, goNode, objview, myDiagram);
      if (debug) console.log("editObjectview: ", selObj);

      // Do dispatch
      const jsnObjview = new jsn.jsnObjectView(objview);
      let data = JSON.parse(JSON.stringify(jsnObjview));
      myMetis.myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
      return;
    }

    case "selectDropdown": {
      if (modalContext.title === 'Select Icon') {
        if (selectedData.category === constants.gojs.C_OBJECT) {
          const selObj = selectedData;
          const node = myDiagram.findNodeForKey(selObj.key);
          const data = node.data;
          const objview = data.objectview;
          if (objview) {
            objview.icon = data.icon;
            const jsnObjview = new jsn.jsnObjectView(data.objectview);
            const modifiedObjviews = new Array();    
            modifiedObjviews.push(jsnObjview);
            modifiedObjviews.map(mn => {
              let data = mn;
              data = JSON.parse(JSON.stringify(data));
              myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
            });
          }
          for (let prop in objview?.data) {
            if (prop === 'icon' && objview[prop] !== "") 
              myDiagram.model.setDataProperty(data, prop, objview[prop]);
          }
          
        } else if (selectedData.category === constants.gojs.C_OBJECTTYPE) {
          const node = selectedData;
          let objtype = node.objecttype;
          objtype = myMetis.findObjectType(objtype.id);
          const objtypeview = objtype.typeview;
          objtypeview.icon = node.icon;
          objtypeview.data.icon = node.icon;
          const jsnObjtypeview = new jsn.jsnObjectTypeView(objtypeview);
          modifiedObjTypeviews.push(jsnObjtypeview);
          modifiedObjTypeviews.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
          })
        }
      } else if (modalContext.title === 'Set Layout Scheme') {
          // This code does not work
          const objview = modalContext.objectview;
          if (objview) {
            objview.groupLayout = modalContext.selected.value + "Layout";
            const jsnObjview = new jsn.jsnObjectView(objview);
            const modifiedObjviews = new Array();    
            modifiedObjviews.push(jsnObjview);
            modifiedObjviews.map(mn => {
              let data = mn;
              data = JSON.parse(JSON.stringify(data));
              myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
            });
          }
      }
      else if (modalContext.case === 'New Model') {
        // Selected metamodel
        const selectedValue = modalContext.selected?.value;
        const metamodel = myMetis.findMetamodelByName(selectedValue); 
        const context = modalContext.context;
        context.args.metamodel = metamodel;
        modalContext.context.postOperation(context);        
      }
      else if (modalContext.case === 'Generate Target Metamodel') {
        const context = modalContext.context;
        const selectedValue = modalContext.selected?.value;
        const objview = myMetis.currentModelview.findObjectViewByName(selectedValue);
        context.myCurrentObjectview = objview;
        let metamodel = myMetis.findMetamodelByName(selectedValue); 
        if (!metamodel) {
          metamodel = new akm.cxMetaModel();
        }
        context.myTargetMetamodel = metamodel;
        context.myCurrentModelview = myMetis.currentModelview;
        myMetis.currentModel.targetMetamodelRef = metamodel.id;
        modalContext.context.postOperation(context);        
      } 
      else if (modalContext.case === 'Add Metamodel') {
        const context = modalContext.context;
        const selectedValue = modalContext.selected?.value;
        let metamodel = myMetis.findMetamodelByName(selectedValue); ;
        const metamodels = context.args.metamodels;
        for (let i=0; i<metamodels?.length; i++) {
          const mm = metamodels[i];
          if (mm.name === selectedValue)
              metamodel = mm;
        }
        context.args.metamodel = metamodel;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Replace Metamodel') {
        const context = modalContext.context;
        const selectedValue = modalContext.selected?.value;
        let metamodel = myMetis.findMetamodelByName(selectedValue); ;
        const metamodels = context.args.metamodels;
        for (let i=0; i<metamodels?.length; i++) {
          const mm = metamodels[i];
          if (mm.name === selectedValue)
              metamodel = mm;
        }
        context.args.metamodel = metamodel;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Delete Metamodel') {
        const selectedValue = modalContext.selected?.value;
        const metamodel = myMetis.findMetamodelByName(selectedValue); 
        const context = modalContext.context;
        context.args.metamodel = metamodel;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Clear Metamodel') {
        const selectedValue = modalContext.selected?.value;
        const metamodel = myMetis.findMetamodelByName(selectedValue); 
        const context = modalContext.context;
        context.args.metamodel = metamodel;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Delete Model') {
        const selectedValue = modalContext.selected?.value;
        const model = myMetis.findModelByName(selectedValue); 
        const context = modalContext.context;
        context.args.model = model;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Generate Method') {
        const myMetamodel = modalContext.context.myMetamodel;
        const selectedValue = modalContext.selected?.value;
        const mtype = myMetamodel.findMethodTypeByName(selectedValue); 
        const context = modalContext.context;
        context.methodType = mtype;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Execute Method') {
        const myMetamodel = modalContext.context.myMetamodel;
        const selectedValue = modalContext.selected?.value;
        const mtd = myMetamodel.findMethodByName(selectedValue); 
        mtd.level = 0;
        const context = modalContext.context;
        context.args.method = mtd;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Export Task Model') {

        // selObj is a node representing a container
        const context = modalContext.context;
        const selectedValue = modalContext.selected?.value;
        const model = myMetis.findModelByName(selectedValue); 
        const fromObjview = context.args.objectview;
        context.args.objectview = fromObjview;
        context.args.model = model;
        modalContext.context.postOperation(context);
        break;        
      }
      else if (modalContext.case === 'Add Port') {
        const selectedValue = modalContext.selected?.value;
        const node = modalContext.node;
        let object = node.object;
        object = myMetis.findObject(object.id)
        const side = selectedValue;
        let name = '';
        switch(side) {
          case 'top':
            name = 'C';
            break;
          case 'bottom':
            name = 'M';
            break;
          case 'left':
            name = 'I';
            break;
          case 'right':
            name = 'O';
            break;
        }
        name = prompt('Enter port name', name);
        let port = object.getPort(side, name);
        if (port) {
          alert('The port ' + name + ' on side ' + side + ' already exists\n Aborted');
        } else {
          port = object.addPort(side, name);
          const jsnObj = new jsn.jsnObject(object);
          const modifiedObjects = new Array();
          modifiedObjects.push(jsnObj);
          modifiedObjects.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
          });
          uit.addPort(port, myDiagram)
          myDiagram.requestUpdate();
        }
      }
      else if (modalContext.case === 'Change Relationship type') {
        const selectedValue = modalContext.selected?.value;
        const reltype = myMetamodel.findRelationshipTypeByName(selectedValue);
        let link = myMetis.currentLink;
        link = myDiagram.findLinkForKey(link.key);
        link.data.relshiptype = reltype;
        link.name = reltype.name;
        const relshipRef = link.data.relshipRef;
        let relship = myModel.findRelationship(relshipRef);
        const fromReltype = relship.type;
        if ( relship.name === fromReltype.name) {
          relship.name = reltype.name;
          myDiagram.model.setDataProperty(link.data, 'name', relship.name);
        }
        relship.type = reltype;
        // Do the dispatches
        const modifiedRelships = new Array();
        const jsnRel = new jsn.jsnRelationship(relship);
        modifiedRelships.push(jsnRel);
        modifiedRelships?.map(mn => {
          let data = (mn) && mn
          data = JSON.parse(JSON.stringify(data));
          myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
        });
      }
      break;
    }

    case "editRelshipview": {
      // selRel is a link representing a relationship or a relationship view
      const selRel = selectedData;
      const gjsLink = myDiagram.findLinkForKey(selRel.key);
      if (!gjsLink)
        break;
      if (gjsLink) gjsLink.isSelected = true;
      const gjsData = gjsLink.data;
      const goLink = myGoModel.findLinkByViewId(selRel.key);
      let relview = myModelview.findRelationshipView(selRel.key);
      let relship = relview.relship;
      const reltype = relship.type;
      const reltypeview = reltype.typeview;
      const selection = myDiagram.selection;
      selection.each(function(sel) {
        const selRel = selectedData;
        let relview = selRel.relshipview;
        if (!relview) 
          relview = myModelview.findRelationshipView(selRel.key);
        if (relview) {
          for (let prop in reltypeview?.data) {
            if (prop === 'class') continue;
            try {
              relview[prop] = selRel[prop];
            } catch {}
          }
          myMetis.addRelationshipView(relview);
        }
      });
      if (gjsLink && relview) {         
        const data = gjsLink.data;
        for (let prop in reltypeview?.data) {
          if (prop === 'template' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'strokecolor' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'strokewidth' && relview[prop] !== "")
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
            if (prop === 'textcolor' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'textscale' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'dash' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'routing' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'curve' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'fromArrow') {
            let fromArrow = relview[prop];
            if (relview[prop] === "") fromArrow = reltypeview.data[prop];
            if (fromArrow === "None") fromArrow = "";
            myDiagram.model.setDataProperty(data, prop, fromArrow);           
          }          
          if (prop === 'fromArrowColor' && relview[prop] !== "") 
              myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'toArrow') {
              let toArrow = relview[prop];
              if (relview[prop] === "") toArrow = reltypeview.data[prop];
              if (toArrow === "None") toArrow = "";
              myDiagram.model.setDataProperty(data, prop, toArrow);           
          }          
          if (prop === 'toArrowColor' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
        }
      }
      const jsnRelview = new jsn.jsnRelshipView(relview);
      modifiedRelviews.push(jsnRelview);
      modifiedRelviews.map(mn => {
        let data = mn;
        myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      });    
      break;
    }
    case "editTypeview": {   
      // To be done !!!

      // selObj is a node representing an object or an objecttype
      const selObj = selectedData;
      const node = myDiagram.findNodeForKey(selObj.key);
      if (!node)
        break;
      if (node) node.isSelected = true;
      // Do a fix
      if (selObj.typeview) {
        const tview = myMetamodel.findObjectTypeView(selObj.typeview.id);
        if (!tview)
          break;
        myMetis.addObjectTypeView(tview);
      }
      // End fix     
      let data, typeview, objtypeview, reltypeview;
      if (selObj.category === constants.gojs.C_OBJECTTYPE) {
        let node = myMetis.currentNode;
        node = myDiagram.findNodeForKey(node.key);
        data = node.data;
        objtypeview = data.typeview;
        typeview = myMetamodel.findObjectTypeView(objtypeview?.id);
        for (let prop in objtypeview?.data) {
          if (prop === 'id') continue;
          if (prop === 'name') continue;
          if (prop === 'abstract') continue;
          if (prop === 'category') continue;
          if (prop === 'class') continue;
          typeview[prop] = selObj[prop];
          typeview.data[prop] = selObj[prop];
          myDiagram.model.setDataProperty(data, prop, selObj[prop]);
        }
        const jsnObjtypeview = new jsn.jsnObjectTypeView(typeview);
        modifiedObjTypeviews.push(jsnObjtypeview);
        modifiedObjTypeviews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          myDiagram.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
        })
      }
      if (selObj.category === constants.gojs.C_OBJECT) {
        data = selObj;
        objtypeview = selObj.typeview;
        objtypeview = myMetamodel.findObjectTypeView(objtypeview?.id);
        // for (let prop in objtypeview?.data) {
        //   objtypeview[prop] = selObj[prop];
        // }
        for (let prop in objtypeview?.data) {
          if (prop === 'id') continue;
          if (prop === 'name') continue;
          if (prop === 'abstract') continue;
          if (prop === 'category') continue;
          if (prop === 'class') continue;
          objtypeview[prop] = selObj[prop];
          objtypeview.data[prop] = selObj[prop];
          myDiagram.model.setDataProperty(data, prop, selObj[prop]);
        }
        const jsnObjtypeview = new jsn.jsnObjectTypeView(objtypeview);
        modifiedObjTypeviews.push(jsnObjtypeview);
        modifiedObjTypeviews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          myDiagram.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
        })
      }
      if (selObj.category === constants.gojs.C_RELSHIPTYPE) {
        const link = myDiagram.findLinkForKey(selObj.key);
        data = link.data;
        let reltype = data.reltype;
        reltype = myMetamodel.findRelationshipType(reltype.id);
        if (reltype) {
          typeview = reltype.typeview;
          typeview = myMetamodel.findRelationshipTypeView(typeview.id);
          reltype.typeview = typeview;
        } else {
          reltypeview = data.typeview;
          typeview = myMetamodel.findRelationshipTypeView(reltypeview.id);
        }
        if (typeview) {
          typeview.setFromArrow2(selObj.relshipkind);
          typeview.setToArrow2(selObj.relshipkind);
          for (let prop in typeview.data) {
            if (prop === 'key') continue;
            if (prop === 'category') continue;
            if (prop === 'abstract') continue;
            if (prop === 'class') continue;
            if (prop === 'relshipkind') continue;

            if (prop === 'fromArrow') {
              let fromArrow = typeview[prop];
              if (fromArrow === "None") fromArrow = "";
              myDiagram.model.setDataProperty(data, prop, fromArrow);           
            }          
            if (prop === 'toArrow') {
              let toArrow = typeview[prop];
              if (toArrow === "None") toArrow = "";
              myDiagram.model.setDataProperty(data, prop, toArrow);  
            }         
            if (prop === 'memberscale') {
                let scale = typeview[prop];
                if (typeview[prop] === 'None') scale = "1";
                myDiagram.model.setDataProperty(data, prop, scale);           
            } else {          
              typeview[prop] = selObj[prop];
              typeview.data[prop] = selObj[prop];
              myDiagram.model.setDataProperty(data, prop, selObj[prop]);
            }
          }
          myMetamodel.addRelationshipTypeView(typeview);
          myMetis.addRelationshipTypeView(typeview);
          const jsnReltypeview = new jsn.jsnRelshipTypeView(typeview);
          modifiedRelTypeviews.push(jsnReltypeview);
          modifiedRelTypeviews.map(mn => {
            let data = mn;
            myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
          })
        }
      }
      if (selObj.category === constants.gojs.C_RELATIONSHIP) {
        const link = myDiagram.findLinkForKey(selObj.key);
        data = link.data;
        reltypeview = data.relshipview?.typeview;
        let relview = data.relshipview;
        const typeviews = myMetis.relshiptypeviews;
        for (let i = 0; i < typeviews.length; i++) {
          const typeview = typeviews[i];
          if (typeview.id === reltypeview?.id) {
            for (let prop in data.typeview?.data) {
              typeview[prop] = selObj[prop];
              typeview.data[prop] = selObj[prop];
            }
            myMetis.addRelationshipTypeView(typeview);
            const jsnReltypeview = new jsn.jsnRelshipTypeView(typeview);
            modifiedRelTypeviews.push(jsnReltypeview);
            modifiedRelTypeviews.map(mn => {
              let data = mn;
              myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
            })
          }
        }
        relview = uic.updateRelationshipView(relview);
        const jsnRelview = new jsn.jsnRelshipView(relview);
        modifiedRelviews.push(jsnRelview);
        modifiedRelviews.map(mn => {
          let data = mn;
          myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
        })
        myDiagram.clearSelection();
        return;
      }
      myDiagram.clearSelection();
      break;
    }
    case "editModelview": {
      break;
    }
    case "connectToSelected": {     
      let nodeFrom: gjs.goObjectNode = modalContext.args.nodeFrom;
      nodeFrom = myGoModel.findNode(nodeFrom.key);
      const fromKey = nodeFrom.key;
      const fromObjview = myModelview.findObjectView(fromKey);
      const fromObj = fromObjview.object;
      const fromType = fromObj.type;
      const nodesTo: gjs.goObjectNode[]  = modalContext.args.nodesTo;
      const selectedOption = modalContext.selected.value;
      const links = [];
      for (let i=0; i<nodesTo.length; i++) {  // Walk through the nodesTo array
        let nodeTo: gjs.goObjectNode = nodesTo[i];
        if (nodeTo) {
          const toKey = nodeTo.key;
          nodeTo = myGoModel.findNode(toKey);
          const toObjview = myModelview.findObjectView(toKey);
          const toObj = toObjview.object;
          const toType = toObj.type;
          // Get the selected relship type
          const relTypename = (selectedOption) && selectedOption; // Get the selected relship typename
          let reltype: akm.cxRelationshipType;
          if (relTypename === constants.types.AKM_REFERS_TO)
            reltype = myMetis.findRelationshipTypeByName(constants.types.AKM_REFERS_TO);
          else
            reltype = myMetis.findRelationshipTypeByName2(relTypename, fromType, toType);
          // Check if the relationship already exists
          let rel = myModel.findRelationship2(fromObj, toObj, relTypename, reltype);
          if (rel && !rel.markedAsDeleted) {
            // The relationship already exists
            // Check if relationship view also exists
            const relviews = myModelview.findRelationshipViewsByRel(rel);
            let found = false;
            for (let i=0; i<relviews.length; i++) {
                const rview = relviews[i];
                if (!rview.markedAsDeleted) {
                    // Relationship view already exists, do nothing
                    found = true;
                    break;
                }
            }
            if (found) 
              continue;
          } else {
            // The relationship does not exist - create it
            rel = new akm.cxRelationship(utils.createGuid(), reltype, fromObj, toObj, relTypename, "");
            myModel.addRelationship(rel); 
            myMetis.addRelationship(rel); 
          }
          let relview: akm.cxRelationshipView;
          let relviews = myModelview.findRelationshipViewsByRel(rel);
          if (relviews.length === 0) {
            // The relationship view does not exist - create it
            if (!relview) { 
              const context = {
                myDiagram: myDiagram,
                myMetis: myMetis,
                myModel: myModel,
                myModelview: myModelview,
                reltype: reltype,
                relTypename: relTypename,
                fromObjview: fromObjview,
                toObjview: toObjview,
                nodeFrom: nodeFrom,
                nodeTo: nodeTo,
              }
              uic.createRelationshipView(rel, context);
            }
          }
        }
      }
    }
  }
}
