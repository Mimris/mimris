// @ts- nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;

import * as akm from '../akmm/metamodeller';
import * as gql from './ui_graphql';
import * as uic from './ui_common';
import * as ui_mtd from './ui_methods';
const utils = require('./utilities');
import * as constants from './constants';
const RegexParser = require("regex-parser");

export function handleInputChange(myMetis: akm.cxMetis, props: any, value: string) {
  if (debug) console.log('14 props', props);
  const propname = props.id;
  const fieldType = props.type;
  const obj = props.obj;
  const context = props.context;
  const pattern = props.pattern;
  if (debug) console.log('20 obj, context:', obj, context);
  if (debug) console.log('21 propname, value:', propname, value);
  // const myDiagram = context.myDiagram;
  let inst, instview, typeview, myInst, myInstview, myItem;
  // Handle object types
  if (obj.category === constants.gojs.C_OBJECTTYPE) {
    const node = obj;
    if (debug) console.log('27 node', node);
    inst = node.objecttype;
    myItem = inst;
    myItem[propname] = value;
    if (debug) console.log('31 myItem', myItem);
  }
  // Handle objects
  if (obj.category === constants.gojs.C_OBJECT) {
    const node = obj;
    inst = node.object;
    myInst = myMetis.findObject(inst.id);
    instview = node.objectview;
    myInstview = myMetis.findObjectView(instview?.id);
    typeview = inst?.type?.typeview;
    if (myInstview) {
      for (let prop in typeview?.data) {
        myInstview[prop] = obj[prop];
      }
    }
    if (debug) console.log('46 myInst', inst, myInstview, typeview);
    if (context?.what === "editObjectview") {
        myItem = myInstview;
    } else if (context?.what === "editTypeview") {
        myItem = myInst.type?.typeview.data;
        if (debug) console.log('51 editTypeview', myItem);
    } else {
        myItem = myInst;
    }
    myItem[propname] = value;
  }
  if (debug) console.log('57 myItem', myItem);
  // Handle relationship types
  if (obj.category === constants.gojs.C_RELSHIPTYPE) {
    const link = obj;
    if (debug) console.log('61 link', link);
    inst = link.reltype;
    myItem = inst;
    myItem[propname] = value;
    if (debug) console.log('65 myItem', myItem);
  }
  // Handle relationships
  if (obj.category === constants.gojs.C_RELATIONSHIP) {
      const link = obj;
      inst = link.relship;
      myInst = myMetis.findRelationship(inst.id);
      instview = link.relshipview;
      myInstview = myMetis.findRelationshipView(instview.id);    
      if (debug) console.log('74 myInst', myInst, myInstview);
      if (context?.what === "editRelshipview") 
          myItem = myInstview;
      else if (context?.what === "editTypeview") 
          myItem = myInst.type?.typeview.data;
      else
          myItem = myInst;
      myItem[propname] = value;
      if (debug) console.log('82 myItem', myItem);
    
    if (debug) console.log('84 myMetis', myMetis);
  }
}

export function handleSelectDropdownChange(selected, context) {
  const myDiagram = context.myDiagram;
  const myMetis = context.myMetis;
  const myMetamodel = context.myMetamodel;
  const myGoModel = context.myGoModel;
  const myModel = context.myModel;
  const myModelview = context.myModelview;
  const modalContext = context.modalContext;
  modalContext.selected = selected;
  const selectedOption = selected.value;
  if (debug) console.log('97 selected, context:', selected, context);
  switch(modalContext.case) {

    case "Change Object type": {
      const typename = (selectedOption) && selectedOption;
      const node = myMetis.currentNode;
      const objtype = myMetis.findObjectTypeByName(typename);
      if (debug) console.log('104 objtype', objtype);
      const objview = (objtype) && uic.setObjectType(node, objtype, context);
      if (debug) console.log('106 objview', objview, node, myMetis);
      const n = myMetis.myDiagram.findNodeForKey(node.key);
      const data = n.data;
      myMetis.myDiagram.model.setDataProperty(data, "typename", typename);
      myMetis.myDiagram.requestUpdate();
    }
    break;

    case "Change Icon": {
      const icon = (selectedOption) && selectedOption;
      const inode = myMetis.currentNode;
      const icn = myMetis.myDiagram.findNodeForKey(inode.key);
      const idata = icn.data;
      myMetis.myDiagram.model.setDataProperty(idata, "icon", icon);
      myMetis.myDiagram.requestUpdate();
    }
    break;

    case "Set Layout Scheme": {
      let item: akm.cxMetaModel | akm.cxModelView = myModelview; 
      const metamodelling = myMetis.modelType === 'Metamodelling';
      if (metamodelling)
        item = myMetamodel;
      if (!item) 
        break;
      const layout = (selectedOption) && selectedOption;
      if (!metamodelling) {
        myModelview.layout = layout;
        const modifiedModelviews = new Array();
        const gqlModelview = new gql.gqlModelView(myModelview);
        modifiedModelviews.push(gqlModelview);
        modifiedModelviews.map(mn => {
          let data = mn;
          myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        })
        if (debug) console.log('141 gqlModelview', gqlModelview);
      } else {
        myMetamodel.layout = layout;
        const modifiedMetamodels = new Array();
        const gqlMetamodel = new gql.gqlMetaModel(myMetamodel, true);
        modifiedMetamodels.push(gqlMetamodel);
        modifiedMetamodels.map(mn => {
          let data = mn;
          myMetis.myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data })
        })
        if (debug) console.log('151 gqlMetamodel', gqlMetamodel);
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
      if (debug) console.log('163 link routing', routing);
      if (!metamodelling) {
        myModelview.routing = routing;
        const modifiedModelviews = new Array();
        const gqlModelview = new gql.gqlModelView(myModelview);
        modifiedModelviews.push(gqlModelview);
        modifiedModelviews.map(mn => {
          let data = mn;
          myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        })
        if (debug) console.log('173 gqlModelview', gqlModelview);
      } else {
        myMetamodel.routing = routing;
        const modifiedMetamodels = new Array();
        const gqlMetamodel = new gql.gqlMetaModel(myMetamodel, true);
        modifiedMetamodels.push(gqlMetamodel);
        modifiedMetamodels.map(mn => {
          let data = mn;
          myMetis.myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data })
        })
        if (debug) console.log('183 gqlMetamodel', gqlMetamodel);
      }
    }
    break;

    case "Set Link Curve": {  
      let item: akm.cxMetaModel | akm.cxModelView = myModelview; 
      const metamodelling = myMetis.modelType === 'Metamodelling';
      if (metamodelling)
        item = myMetamodel;
      if (!item) 
        break;
      const linkcurve = (selectedOption) && selectedOption;
      if (debug) console.log('196 link curve', linkcurve);
      if (!metamodelling) {
        myModelview.linkcurve = linkcurve;
        const modifiedModelviews = new Array();
        const gqlModelview = new gql.gqlModelView(myModelview);
        modifiedModelviews.push(gqlModelview);
        modifiedModelviews.map(mn => {
          let data = mn;
          myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        })
        if (debug) console.log('206 gqlModelview', gqlModelview);
      } else {
        myMetamodel.linkcurve = linkcurve;
        const modifiedMetamodels = new Array();
        const gqlMetamodel = new gql.gqlMetaModel(myMetamodel, true);
        modifiedMetamodels.push(gqlMetamodel);
        modifiedMetamodels.map(mn => {
          let data = mn;
          myMetis.myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data })
        })
        if (debug) console.log('216 gqlMetamodel', gqlMetamodel);
      }
    }
    break;

    case "New Model": {
      if (debug) console.log('222', selected);
      const refMetamodelName = (selectedOption) && selectedOption;
      const refMetamodel = myMetis.findMetamodelByName(refMetamodelName);
      
      // myMetis.currentTargetMetamodel = targetMetamodel
      // myMetis.currentModel.targetMetamodelRef = targetMetamodel.id
      if (debug) console.log('228 Diagram', refMetamodel, myMetis);
      // let mmdata = myMetis.currentModel;
      // if (debug) console.log('230 Diagram', mmdata);        
      // myMetis.myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: {mmdata} })
      } 
    break;

    case "Set Target Model": { 
      const modelName = (selectedOption) && selectedOption;
      const targetModel = myMetis.findModelByName(modelName);
      myMetis.currentTargetModel = targetModel
      myMetis.currentModel.targetModelRef = targetModel.id
      if (debug) console.log('240 Diagram', targetModel, myMetis);
      const mdata = new gql.gqlModel(myMetis.currentModel, true);
      if (debug) console.log('242 Diagram', mdata);        
      myMetis.myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: mdata })
    }
    break;

    case "Set Target Metamodel":   
    case "Generate Target Metamodel": {
      const metamodelName = (selectedOption) && selectedOption;
      const targetMetamodel = myMetis.findMetamodelByName(metamodelName);
      // myMetis.currentTargetMetamodel = targetMetamodel;
      myMetis.currentModel.targetMetamodelRef = targetMetamodel.id
      if (debug) console.log('253 Diagram', targetMetamodel, myMetis);
      const mmdata = new gql.gqlModel(myMetis.currentModel, true);
      if (debug) console.log('255 Diagram', mmdata);        
      myMetis.myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: mmdata });
    }
    break;

    case "Change Relationship type": { 
      const typename = (selectedOption) && selectedOption;
      const link = myMetis.currentLink;
      let relship = link.relship;
      relship = myModel.findRelationship(relship.id);
      let fromNode = myGoModel?.findNode(link.from);
      let toNode   = myGoModel?.findNode(link.to);
      if (debug) console.log('265 myGoModel, link, from and toNode: ', myGoModel, link, fromNode, toNode);
      let fromType = fromNode?.objecttype;
      let toType   = toNode?.objecttype;
      fromType = myMetis.findObjectType(fromType?.id);
      toType   = myMetis.findObjectType(toType?.id);
      if (debug) console.log('270 link', fromType, toType);
      const reltype = myMetis.findRelationshipTypeByName2(typename, fromType, toType);
      const relshipkind = reltype.relshipkind;
      relship.setRelshipKind(relshipkind);
      switch(relshipkind) {
        case 'Composition':
        case 'Aggregation':
          relship.cardinalityFrom = reltype.cardinalityFrom;
          relship.cardinalityTo = reltype.cardinalityTo;
      }
      const modifiedRelships = new Array();
      const gqlRelship = new gql.gqlRelationship(relship);
      if (debug) console.log('280 gqlRelship', gqlRelship);
      modifiedRelships.push(gqlRelship);
      modifiedRelships.map(mn => {
        let data = mn;
        myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
      });
      if (debug) console.log('287 reltype', reltype, fromType, toType);
        const relview = (reltype) && uic.setRelationshipType(link, reltype, context);
        if (debug) console.log('274 relview', relview);
        myMetis.myDiagram.requestUpdate();
      }
      break;

    case "Edit Attribute": {
      const propname = selected.value;
      if (debug) console.log('281 propname', propname);
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
          if (debug) console.log('300', propname, value);
          if (propname === 'description') {
            inst.description = value;
          } else {
            console.log('304 prop, value', propname, value);
            inst[propname] = value;
          }
          switch(inst.category) {
          case 'Relationship':
            inst = myMetis.findRelationship(inst.id);
            inst[propname] = value;
            if (debug) console.log('311 inst', inst);
            const modifiedRelships = new Array();
            const gqlRel = new gql.gqlRelationship(inst);
            if (debug) console.log('314 inst, gqlRel', inst, gqlRel);
            modifiedRelships.push(gqlRel);
            modifiedRelships?.map(mn => {
              let data = (mn) && mn
              myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
            });
            break;
          case 'Relationship type':
            inst = myMetis.findRelationshipType(inst.id);
            if (propname === 'cardinalityFrom' || propname === 'cardinalityTo') {
              const patt = '\\b(n|[0-9])\\b[-]\\b(n|[1-9])\\b';
              const regex = new RegexParser(patt);
              console.log('326 regex:', regex, value);
              if (!regex.test(value)) {
                alert('Value: ' + value + ' IS NOT valid');
                break;
              }
            }
            inst[propname] = value;
            if (debug) console.log('333 inst', inst);
            const modifiedReltypes = new Array();
            const gqlRelType = new gql.gqlRelationshipType(inst, true);
            if (debug) console.log('336 inst, gqlRel', inst, gqlRelType);
            modifiedReltypes.push(gqlRelType);
            modifiedReltypes?.map(mn => {
              let data = (mn) && mn
              myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
            });
            break;
          }
        }
      }
    }
    break;

    case "Create Relationship": {
      if (debug) console.log('349 context', context);
      const myMetamodel = context.myMetamodel;
      const myGoModel = context.myGoModel;
      const myModelview = context.myModelview;
      const myDiagram = context.myDiagram;
      const modalContext = context.modalContext;
      const data = modalContext.data;
      const typename = selected.value;
      modalContext.selected = selected;
      if (debug) console.log('358 typename', typename);
      const fromNode = myGoModel.findNode(modalContext.data.from);
      // const nodeFrom = myDiagram.findNodeForKey(fromNode?.key)
      const toNode = myGoModel.findNode(modalContext.data.to);
      // const nodeTo   = myDiagram.findNodeForKey(toNode?.key)
      let fromType = fromNode?.objecttype;
      let toType   = toNode?.objecttype;
      fromType = myMetamodel.findObjectType(fromType?.id);
      if (debug) console.log('366 fromType', fromType);
      if (!fromType) fromType = myMetamodel.findObjectType(fromNode?.object?.typeRef);
      if (fromType) {
          fromType.allObjecttypes = myMetamodel.objecttypes;
          fromType.allRelationshiptypes = myMetamodel.relshiptypes;
      }
      toType   = myMetamodel.findObjectType(toType?.id);
      if (debug) console.log('373 toType', toType);
      if (!toType) toType = myMetamodel.findObjectType(toNode?.object?.typeRef);
      if (toType) {
          toType.allObjecttypes = myMetamodel.objecttypes;
          toType.allRelationshiptypes = myMetamodel.relshiptypes;
      }
      const reltype = context.myMetamodel.findRelationshipTypeByName2(typename, fromType, toType);
      if (debug) console.log('380 reltype', reltype, fromType, toType);

      if (!reltype) {
          alert("Relationship type given does not exist!")
          myDiagram.model.removeLinkData(data);
          return;
      }

      if (reltype) {
        if (debug) console.log('912 reltype', reltype);
        const reltypeview = reltype.typeview;
        if (reltypeview) {
          const modifiedLinkTypeViews = new Array();
          const gqlTypeView = new gql.gqlRelshipTypeView(reltypeview);
          modifiedLinkTypeViews.push(gqlTypeView);
          if (debug) console.log('920 gqlTypeView', gqlTypeView);
          modifiedLinkTypeViews?.map(mn => {
            let data = (mn) && mn
            myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
          })
        }
      }
      if (debug) console.log('387 data, reltype', data, reltype);
      data.relshiptype = reltype;
    }
    break;

    default:
      break;
  }
}

export function handleCloseModal(selectedData: any, props: any, modalContext: any) {
  if (debug) console.log('398 selectedData, props, modalContext: ', selectedData, props, modalContext);
  const what = modalContext.what;
  let myDiagram = modalContext.myDiagram;
  if (!myDiagram && modalContext.context) myDiagram = modalContext.context.myDiagram;
  const myMetis = props.myMetis;
  const myModelview = myMetis.currentModelview;
  const myGoModel = myMetis.myGoModel;
  // Prepare for dispatches
  const modifiedObjtypes     = new Array();    
  const modifiedReltypes     = new Array();    
  const modifiedObjTypeviews = new Array();    
  const modifiedRelTypeviews = new Array();    
  const modifiedObjviews     = new Array();    
  const modifiedRelviews     = new Array();    
  const modifiedObjects      = new Array();    
  const modifiedRelships     = new Array();    
  switch(what) {
    case "editObjectType": {
      const selObj = selectedData;
      if (debug) console.log('417 selObj', selObj);
      // selObj is a node representing an objecttype
      let node = selObj;
      let type = node.objecttype;
      node = myDiagram.findNodeForKey(node.key);
      type = myMetis.findObjectType(type.id);
      if (debug) console.log('423 selObj', selObj, type);
      const data = node.data;
      if (debug) console.log('425 node, type', data, type);
      for (let k in selObj) {
        if (typeof(type[k]) === 'object')    continue;
        if (typeof(type[k]) === 'function')  continue;
        if (!uic.isPropIncluded(k, type))    continue;
        type[k] = selObj[k];
        myDiagram.model.setDataProperty(data, k, type[k]);
      }
      // Do the dispatches
      const gqlObjtype = new gql.gqlObjectType(type, true);
      if (debug) console.log('435 gqlObjtype', gqlObjtype);
      modifiedObjtypes.push(gqlObjtype);
      modifiedObjtypes.map(mn => {
        let data = mn;
        props.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
      })
      if (debug) console.log('441 selObj', selObj);
      break;
    }
    case "editRelationshipType": {
      const selObj = selectedData;
      if (debug) console.log('446 selObj', selObj);
      // selObj is a link representing a relationship type
      
      let link = selObj;
      const data = link.data;
      let type = link.reltype;
      if (!type) type = data.reltype;
      link = myDiagram.findLinkForKey(link.key);
      if (!link)
          break;
      type = myMetis.findRelationshipType(type?.id);
      const reltypeview = type?.typeview;
      if (type) {
        const cardinalityFrom = type.getCardinalityFrom();
        const cardinalityTo = type.getCardinalityTo();
        if (debug) console.log('461 cardinalities', cardinalityFrom, cardinalityTo);
        type.cardinalityFrom = cardinalityFrom;
        type.cardinalityTo = cardinalityTo;
        if (reltypeview)
          reltypeview.setRelshipKind(type.relshipkind);
        if (debug) console.log('467 link', link, type);
        if (debug) console.log('468 link, type', data, type);
      } else 
        break;

      for (let k in selObj) {
        if (typeof(type[k]) === 'object')    continue;
        if (typeof(type[k]) === 'function')  continue;
        if (!uic.isPropIncluded(k, type))    continue;
        type[k] = selObj[k];
        myDiagram.model.setDataProperty(link.data, k, type[k]);
        if (debug) console.log('478 type', type);
      }
      // Do the dispatches
      const gqlReltype = new gql.gqlRelationshipType(type, true);
      if (debug) console.log('482 gqlReltype', type, gqlReltype);
      modifiedReltypes.push(gqlReltype);
      modifiedReltypes.map(mn => {
        let data = mn;
        props.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
      })
      if (debug) console.log('488 selObj', selObj);
      break;
    }
    case "editObject": {
      const selObj = selectedData;
      // selObj is a node representing an objectview
      let node = selObj;
      let obj = selObj.object;
      obj = myMetis.findObject(obj?.id);
      if (debug) console.log('497 selObj', selObj, obj);
      const properties = obj.setAndGetAllProperties(myMetis);
      const gqlObject = new gql.gqlObject(obj);
      if (debug) console.log('500 obj, gqlObject', obj, gqlObject);
      const type = obj?.type;
      for (let i=0; i<properties?.length; i++) {
        const prop = properties[i];
        if (!prop)
          continue;
        const dtypeRef = prop.datatypeRef;
        const dtype = myMetis.findDatatype(dtypeRef);
        if (dtype) {
          const pattern = dtype.inputPattern;
          const value = obj[prop.name];
          if (debug) console.log('508 value', pattern, value);
          if (pattern && value) {
              const regex = new RegexParser(pattern);
            if (debug) console.log('511 regex:', regex);
            if (!regex.test(value)) {
              const errormsg = "Value: '" + value + "' of '" + prop.name + "' IS NOT valid"
              alert(errormsg);
              return;
            }
          }
        }
        const expr = obj.getPropertyValue(prop, myMetis);
        obj[prop.name] = expr;
        gqlObject[prop.name] = expr;
      }
      if (debug) console.log('527 obj, gqlObject, node', obj, gqlObject, node);
      node = myDiagram.findNodeForKey(node.key)
      const data = node.data;
      if (debug) console.log('530 node', node);
      for (let k in data) {
        if (typeof(obj[k]) === 'object')    continue;
        if (typeof(obj[k]) === 'function')  continue;
        if (!uic.isPropIncluded(k, type))   continue;
        if (k === 'abstract') obj[k] = selObj[k];
        if (k === 'viewkind') obj[k] = selObj[k];
        if (debug) console.log('537 prop', k);
        if (debug) console.log('538 node', node, data, obj);
        myDiagram.model.setDataProperty(data, k, obj[k]);
      }
      const myGoModel = myMetis.gojsModel;
      const myNode = myGoModel.findNode(node.key);
      myNode.name = data.name;
      if (debug) console.log('544 myNode, myMetis', myNode, myMetis);
      if (debug) console.log('546 gqlObject', gqlObject);
      modifiedObjects.push(gqlObject);
      // Do the dispatches
      modifiedObjects.map(mn => {
        let data = mn;
        props.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
      })
      modifiedObjviews.map(mn => {
        let data = mn;
        if (debug) console.log('555 gqlObjview', data);
        props.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
      })
      if (debug) console.log('558 selObj', selObj);
    break;
    }
    case "editRelationship": {
      const rel = selectedData;
      const type = rel.type;
      const link = myDiagram.findLinkForKey(rel.key);
      if (!link)
        break;
      if (debug) console.log('567 rel, link', rel, link);
      const data = link.data;
      if (debug) console.log('569 data', data);
      let relship = data.relship;
      relship = myMetis.findRelationship(relship.id);
      relship['cardinalityFrom'] = relship.getCardinalityFrom();
      relship['cardinalityTo'] = relship.getCardinalityTo();
      // relship.cardinalityTo = relship.cardinality;
      if (debug) console.log('575 relship, rel', relship, rel);
      for (let k in rel) {
        if (typeof(rel[k]) === 'object')    continue;
        if (typeof(rel[k]) === 'function')  continue;
        if (!uic.isPropIncluded(k, type))  continue;
        myDiagram.model.setDataProperty(data, k, relship[k]);
      }
      const gqlRelship = new gql.gqlRelationship(relship);
      if (debug) console.log('583 gqlRelship', gqlRelship);
      modifiedRelships.push(gqlRelship);
      modifiedRelships.map(mn => {
        let data = mn;
        props.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
      });
      let relview = link.data.relshipview;
      relview = myMetis.findRelationshipView(relview.id);
      if (relship.relshipkind !== constants.relkinds.REL) {
        relview.setFromArrow2(relship.relshipkind);
        relview.setToArrow2(relship.relshipkind);
        myDiagram.model.setDataProperty(data, 'fromArrow', relview.fromArrow);
        myDiagram.model.setDataProperty(data, 'toArrow', relview.toArrow);
        myDiagram.model.setDataProperty(data, 'fromArrowColor', relview.fromArrowColor);
        myDiagram.model.setDataProperty(data, 'toArrowColor', relview.toArrowColor);
      }
      if (debug) console.log('598 relship, relview', relship, relview);
      if (myModelview.showCardinality) {
        myDiagram.model.setDataProperty(data, 'cardinalityFrom', relship.getCardinalityFrom());
        myDiagram.model.setDataProperty(data, 'cardinalityTo', relship.getCardinalityTo());
        if (debug) console.log('603 myModelview', myModelview);
      } else {
        myDiagram.model.setDataProperty(data, 'cardinalityFrom', '');
        myDiagram.model.setDataProperty(data, 'cardinalityTo', '');
      }
      const gqlRelview = new gql.gqlRelshipView(relview);
      gqlRelview.name = gqlRelship.name;
      if (debug) console.log('610 gqlRelview', gqlRelview);
      modifiedRelviews.push(gqlRelview);
      modifiedRelviews.map(mn => {
        let data = mn;
        if (debug) console.log('614 gqlRelview', data);
        props.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      })        
      break;
    }
    case "editObjectview": {
      let selObjview = selectedData;
      if (debug) console.log('621 selObjview', selObjview);
      const objview = selObjview.objectview;
      if (!objview)
        break;
      const objtypeview = objview.typeview;
      if (debug) console.log('626 objview, objtypeview', selObjview, objview, objtypeview);
      const node = myDiagram.findNodeForKey(selObjview.key);
      if (debug) console.log('628 node', node, selObjview);
      const data = node.data;
      for (let prop in  objtypeview?.data) {
        objview[prop] = selObjview[prop];
      }
      const gqlObjview = new gql.gqlObjectView(objview);
      if (debug) console.log('634 gqlObjview', data, gqlObjview);
      modifiedObjviews.push(gqlObjview);
      modifiedObjviews.map(mn => {
        let data = mn;
        if (debug) console.log('638 data', data);
        props.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
      })
      if (debug) console.log('641 data', data);
      for (let prop in objtypeview?.data) {
        if (prop === 'figure' && objview[prop] !== "") 
          myDiagram.model.setDataProperty(data, prop, objview[prop]);
        if (prop === 'fillcolor' && objview[prop] !== "") 
          myDiagram.model.setDataProperty(data, prop, objview[prop]);
        if (prop === 'strokecolor' && objview[prop] !== "") 
          myDiagram.model.setDataProperty(data, prop, objview[prop]);
        if (prop === 'strokewidth' && objview[prop] !== "")
          myDiagram.model.setDataProperty(data, prop, objview[prop]);
        if (prop === 'icon' && objview[prop] !== "") 
          myDiagram.model.setDataProperty(data, prop, objview[prop]);
      }
      break;
    }
    case "selectDropdown": {
      if (modalContext.title === 'Select Icon') {
        if (selectedData.category === constants.gojs.C_OBJECT) {
          const selObj = selectedData;
          const node = myDiagram.findNodeForKey(selObj.key);
          if (debug) console.log('661 node', node);
          const data = node.data;
          const objview = data.objectview;
          if (objview) {
            objview.icon = data.icon;
            const gqlObjview = new gql.gqlObjectView(data.objectview);
            if (debug) console.log('667 gqlObjview', data, gqlObjview);
            modifiedObjviews.push(gqlObjview);
            modifiedObjviews.map(mn => {
              let data = mn;
              if (debug) console.log('671 data', data);
              props.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
            })
            for (let prop in objview?.data) {
              if (prop === 'icon' && objview[prop] !== "") 
              myDiagram.model.setDataProperty(data, prop, objview[prop]);
            }
          }
        } else if (selectedData.category === constants.gojs.C_OBJECTTYPE) {
          const node = selectedData;
          if (debug) console.log('681 node', node);
          let objtype = node.objecttype;
          objtype = myMetis.findObjectType(objtype.id);
          const objtypeview = objtype.typeview;
          objtypeview.icon = node.icon;
          objtypeview.data.icon = node.icon;
          const gqlObjtypeview = new gql.gqlObjectTypeView(objtypeview);
          if (debug) console.log('688 gqlObjtypeview', objtypeview, gqlObjtypeview);
          modifiedObjTypeviews.push(gqlObjtypeview);
          modifiedObjTypeviews.map(mn => {
            let data = mn;
            props.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
          })
        }
      }
      else if (modalContext.case === 'New Model') {
        // Selected metamodel
        const selectedValue = modalContext.selected?.value;
        if (debug) console.log('699 selected: ', modalContext.selectedValue);
        const metamodel = myMetis.findMetamodelByName(selectedValue); 
        const context = modalContext.context;
        context.args.metamodel = metamodel;
        modalContext.context.postOperation(context);        
      }
      else if (modalContext.case === 'Generate Target Metamodel') {
        const context = modalContext.context;
        const selectedValue = modalContext.selected?.value;
        if (debug) console.log('708 selected: ', modalContext.selectedValue);
        const metamodel = myMetis.findMetamodelByName(selectedValue); 
        context.myTargetMetamodel = metamodel;
        context.myCurrentModelview = myMetis.currentModelview;
        myMetis.currentModel.targetMetamodelRef = metamodel.id;
        modalContext.context.postOperation(context);        
      } 
      else if (modalContext.case === 'Replace Metamodel') {
        const selectedValue = modalContext.selected?.value;
        const metamodel = myMetis.findMetamodelByName(selectedValue); 
        if (debug) console.log('718 metamodel, modalContext: ', metamodel, modalContext);
        const context = modalContext.context;
        context.args.metamodel = metamodel;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Delete Metamodel') {
        const selectedValue = modalContext.selected?.value;
        const metamodel = myMetis.findMetamodelByName(selectedValue); 
        if (debug) console.log('718 metamodel, modalContext: ', metamodel, modalContext);
        const context = modalContext.context;
        context.args.metamodel = metamodel;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Delete Model') {
        const selectedValue = modalContext.selected?.value;
        const model = myMetis.findModelByName(selectedValue); 
        if (debug) console.log('727 model, modalContext: ', model, modalContext);
        const context = modalContext.context;
        context.args.model = model;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Generate Method') {
        const myMetamodel = modalContext.context.myMetamodel;
        const selectedValue = modalContext.selected?.value;
        const mtype = myMetamodel.findMethodTypeByName(selectedValue); 
        if (debug) console.log('744 methodType, modalContext: ', mtype, modalContext);
        const context = modalContext.context;
        context.methodType = mtype;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Execute Method') {
        const myMetamodel = modalContext.context.myMetamodel;
        const selectedValue = modalContext.selected?.value;
        const mtd = myMetamodel.findMethodByName(selectedValue); 
        if (debug) console.log('754 method, modalContext: ', mtd, modalContext);
        const context = modalContext.context;
        context.args.method = mtd;
        modalContext.context.postOperation(context);        
        break;
      }
    }
    case "editRelshipview": {
      const selRelview = selectedData;
      let relview = selRelview.relshipview;
      if (!relview)
        break;
      relview = myMetis.findRelationshipView(relview.id);
      const reltype = selRelview.relshiptype;
      let reltypeview = reltype.typeview;
      if (reltypeview) {
        reltypeview = myMetis.findRelationshipTypeView(reltypeview.id);
      }
      if (!reltypeview) {
        const id = utils.createGuid();
        reltypeview = new akm.cxRelationshipTypeView(id, id, reltype, "");
        reltypeview.typeview = reltypeview;
      }
      if (debug) console.log('740 relview, reltypeview', selRelview, relview, reltypeview);
      const link = myDiagram.findLinkForKey(selRelview.key);
      const data = link.data;
      for (let prop in  reltypeview?.data) {
        relview[prop] = selRelview[prop];
      }
      if (debug) console.log('746 relview', relview);
      for (let prop in reltypeview?.data) {
        if (prop === 'strokecolor' && relview[prop] !== "") 
          myDiagram.model.setDataProperty(data, prop, relview[prop]);
        if (prop === 'strokewidth' && relview[prop] !== "")
          myDiagram.model.setDataProperty(data, prop, relview[prop]);
        if (prop === 'dash' && relview[prop] !== "") 
          myDiagram.model.setDataProperty(data, prop, relview[prop]);
        if (prop === 'fromArrow' && relview[prop] !== "") 
          myDiagram.model.setDataProperty(data, prop, relview[prop]);
        if (prop === 'fromArrowColor' && relview[prop] !== "") 
          myDiagram.model.setDataProperty(data, prop, relview[prop]);
        if (prop === 'toArrow' && relview[prop] !== "") 
          myDiagram.model.setDataProperty(data, prop, relview[prop]);
        if (prop === 'toArrowColor' && relview[prop] !== "") 
          myDiagram.model.setDataProperty(data, prop, relview[prop]);
      }
      const gqlRelview = new gql.gqlRelshipView(relview);
      if (debug) console.log('764 data, gqlRelview', link, data, gqlRelview);
      modifiedRelviews.push(gqlRelview);
      modifiedRelviews.map(mn => {
        let data = mn;
        props.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      })
      const gqlReltypeview = new gql.gqlRelshipTypeView(reltypeview);
      if (debug) console.log('764 data, gqlReltypeview', link, data, gqlReltypeview);
      modifiedRelTypeviews.push(gqlReltypeview);
      modifiedRelTypeviews.map(mn => {
        let data = mn;
        props.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
      })
      break;
    }
    case "editTypeview": {   
      const selObj = selectedData;
      if (debug) console.log('774 selObj', selObj);
      let inst, data, typeview;
      if (selObj.category === constants.gojs.C_OBJECTTYPE) {
        let node = myMetis.currentNode;
        node = myDiagram.findNodeForKey(node.key);
        data = node.data;
        if (debug) console.log('780 node, data', node, data);
        typeview = data.typeview;
        typeview = myMetis.findObjectTypeView(typeview?.id);
        let objtype = node.objecttype;
        if (!typeview) typeview = objtype.newDefaultTypeView('Object');
        for (let prop in typeview?.data) {
          typeview.data[prop] = selObj[prop];
          typeview[prop] = selObj[prop];
        }
        if (debug) console.log('789 typeview', typeview, data);
         const gqlObjtypeview = new gql.gqlObjectTypeView(typeview);
        if (debug) console.log('791 gqlObjtypeview', gqlObjtypeview);
        modifiedObjTypeviews.push(gqlObjtypeview);
        modifiedObjTypeviews.map(mn => {
          let data = mn;
          props.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
        })
      }
      if (selObj.category === constants.gojs.C_OBJECT) {
        const node = myDiagram.findNodeForKey(selObj.key);
        data = node.data;
        if (debug) console.log('801 objtypeview, data', data);
        typeview = data.objectview?.typeview;
        typeview = data.typeview;
        typeview = myMetis.findObjectTypeView(typeview.id);
        const gqlObjtypeview = new gql.gqlObjectTypeView(typeview);
        if (debug) console.log('806 gqlObjtypeview', gqlObjtypeview);
        modifiedObjTypeviews.push(gqlObjtypeview);
        modifiedObjTypeviews.map(mn => {
          let data = mn;
          props.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
        })
      }
      if (selObj.category === constants.gojs.C_RELSHIPTYPE) {
        const link = myDiagram.findLinkForKey(selObj.key);
        data = link.data;
        if (debug) console.log('816 data', data);
        typeview = data.typeview;
        typeview = myMetis.findRelationshipTypeView(typeview.id);
        for (let prop in typeview.data) {
          typeview.data[prop] = selObj[prop];
          data[prop] = selObj[prop];
        }
        typeview.setFromArrow2(selObj.relshipkind);
        typeview.setToArrow2(selObj.relshipkind);
        if (debug) console.log('825 typeview', typeview, data);
        const gqlReltypeview = new gql.gqlRelshipTypeView(typeview);
        if (debug) console.log('827 gqlReltypeview', gqlReltypeview);
        modifiedRelTypeviews.push(gqlReltypeview);
        modifiedRelTypeviews.map(mn => {
          let data = mn;
          props.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
        })
      }
      if (selObj.category === constants.gojs.C_RELATIONSHIP) {
        const link = myDiagram.findLinkForKey(selObj.key);
        data = link.data;
        typeview = data.relshipview.typeview;
        typeview = myMetis.findRelationshipTypeView(typeview.id);
        if (debug) console.log('839 reltypeview, link', typeview, link);
        const gqlReltypeview = new gql.gqlRelshipTypeView(typeview);
        if (debug) console.log('841 gqlReltypeview', gqlReltypeview);
        modifiedRelTypeviews.push(gqlReltypeview);
        modifiedRelTypeviews.map(mn => {
          let data = mn;
          props.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
        })
      }
      if (data) {
        if (debug) console.log('849 data', data);
        for (let prop in typeview) {
          if (prop === 'figure' && typeview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, typeview[prop]);
          if (prop === 'fillcolor' && typeview[prop] !== "") {
            if (debug) console.log('854 fillcolor', typeview[prop]);
            myDiagram.model.setDataProperty(data, prop, typeview[prop]);
          }
          if (prop === 'strokecolor' && typeview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, typeview[prop]);
          if (prop === 'strokewidth' && typeview[prop] !== "")
            myDiagram.model.setDataProperty(data, prop, typeview[prop]);
          if (prop === 'icon'/* && typeview[prop] !== "" */) 
            myDiagram.model.setDataProperty(data, prop, typeview[prop]);
          if (prop === 'dash' && typeview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, typeview[prop]);
          if (prop === 'fromArrow' && typeview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, typeview[prop]);
          if (prop === 'toArrow' && typeview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, typeview[prop]);
          if (prop === 'fromArrowColor' && typeview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, typeview[prop]);
          if (prop === 'toArrowColor' && typeview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, typeview[prop]);
        }
      }
      break;
    }

    if (false) {
      // case "editProject": {
      //   const project = selectedData;
      //   if (debug) console.log('323 myMetis', myMetis);
      //   break;
      // }
      // case "editModel": {
      //   const model = selectedData;
      //   if (debug) console.log('327 obj', model);
      //   break;
      // }
      // case "editModelview": {
      //   const mview = selectedData;
      //   if (debug) console.log('331 modelview', mview);
      //   break;
      // }
    }

    // Handle all the dispatches
    modifiedObjTypeviews.map(mn => {
      let data = mn;
      props.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
    })
  }
}

