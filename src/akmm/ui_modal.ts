// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;

// import * as go from 'gojs';
// import * as akm from '../../../akmm/metamodeller';
// import * as gjs from '../../../akmm/ui_gojs';
import * as gql from './ui_graphql';
import * as uic from './ui_common';
// import * as gen from '../../../akmm/ui_generateTypes';
// import * as utils from '../../../akmm/utilities';
import * as constants from './constants';
// const glb = require('../../../akmm/akm_globals');
// const printf = require('printf');
const RegexParser = require("regex-parser");

export function handleInputChange(myMetis: akm.cxMetis, props: any, value: string) {
  if (debug) console.log('20 props', props);
  const propname = props.id;
  const fieldType = props.type;
  const obj = props.obj;
  const context = props.context;
  const pattern = props.pattern;
  if (debug) console.log('26 obj, context:', obj, context);
  if (debug) console.log('27 propname, value:', propname, value);
  // const myDiagram = context.myDiagram;
  let inst, instview, typeview, myInst, myInstview, myItem;
  // Handle object types
  if (obj.category === constants.gojs.C_OBJECTTYPE) {
    const node = obj;
    if (debug) console.log('34 node', node);
    inst = node.objecttype;
    myItem = inst;
    myItem[propname] = value;
    if (debug) console.log('38 myItem', myItem);
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
    if (debug) console.log('53 myInst', inst, myInstview, typeview);
    if (context?.what === "editObjectview") {
        myItem = myInstview;
    } else if (context?.what === "editTypeview") {
        myItem = myInst.type?.typeview.data;
        if (debug) console.log('58 editTypeview', myItem);
    } else {
        myItem = myInst;
    }
    myItem[propname] = value;
  }
  if (debug) console.log('64 myItem', myItem);
  // Handle relationship types
  if (obj.category === constants.gojs.C_RELSHIPTYPE) {
    const link = obj;
    if (debug) console.log('68 link', link);
    inst = link.reltype;
    myItem = inst;
    myItem[propname] = value;
    if (debug) console.log('72 myItem', myItem);
  }
  // Handle relationships
  if (obj.category === constants.gojs.C_RELATIONSHIP) {
      const link = obj;
      inst = link.relship;
      myInst = myMetis.findRelationship(inst.id);
      instview = link.relshipview;
      myInstview = myMetis.findRelationshipView(instview.id);    
      if (debug) console.log('81 myInst', myInst, myInstview);
      if (context?.what === "editRelshipview") 
          myItem = myInstview;
      else if (context?.what === "editTypeview") 
          myItem = myInst.type?.typeview.data;
      else
          myItem = myInst;
      myItem[propname] = value;
      if (debug) console.log('89 myItem', myItem);
    
    if (debug) console.log('91 myMetis', myMetis);
  }
}

export function handleSelectDropdownChange(selected, context) {
  const myMetis = context.myMetis;
  const myGoModel = context.gojsModel;
  const myModelView = context.myModelView;
  const modalContext = context.modalContext;

  const selectedOption = selected.value;
  if (debug) console.log('101 selectedOption, modalContext:', selectedOption, modalContext);
  let typename;
  switch(modalContext.case) {

    case "Change Object type":    
      typename = (selectedOption) && selectedOption;
      const node = myMetis.currentNode;
      const objtype = myMetis.findObjectTypeByName(typename);
      if (debug) console.log('109 objtype', objtype);
      const objview = (objtype) && uic.setObjectType(node, objtype, context);
      if (debug) console.log('111 objview', objview, node, myMetis);
      const n = myMetis.myDiagram.findNodeForKey(node.key);
      const data = n.data;
      myMetis.myDiagram.model.setDataProperty(data, "typename", typename);
      myMetis.myDiagram.requestUpdate();
      break;

    case "Change Icon":    
      const icon = (selectedOption) && selectedOption;
      const inode = myMetis.currentNode;
      const icn = myMetis.myDiagram.findNodeForKey(inode.key);
      const idata = icn.data;
      myMetis.myDiagram.model.setDataProperty(idata, "icon", icon);
      myMetis.myDiagram.requestUpdate();
      break;

    case "Set Layout Scheme": {
      if (!myModelView) 
        break;
      const layout = (selectedOption) && selectedOption;
      myModelView.layout = layout; 
      const modifiedModelviews = new Array();
      const gqlModelview = new gql.gqlModelView(myModelView);
      modifiedModelviews.push(gqlModelview);
      modifiedModelviews.map(mn => {
        let data = mn;
        myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
      })
      if (debug) console.log('619 gqlModelview', gqlModelview);
      break;
      }
    case "Set Routing Scheme": {  
      if (!myModelView) 
        break;
      const routing = (selectedOption) && selectedOption;
      if (debug) console.log('655 link routing', routing);
      myModelView.routing = routing; 
      const modifiedModelviews = new Array();
      const gqlModelview = new gql.gqlModelView(myModelView);
      modifiedModelviews.push(gqlModelview);
      modifiedModelviews.map(mn => {
        let data = mn;
        myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
      })
      if (debug) console.log('664 gqlModelview', gqlModelview);
      break;
    }
    case "Set Link Curve": {  
      if (!myModelView) 
        break;
      const curve = (selectedOption) && selectedOption;
      if (debug) console.log('671 link curve', curve);
      myModelView.linkcurve = curve; 
      const modifiedModelviews = new Array();
      const gqlModelview = new gql.gqlModelView(myModelView);
      modifiedModelviews.push(gqlModelview);
      modifiedModelviews.map(mn => {
        let data = mn;
        myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
      })
      if (debug) console.log('664 gqlModelview', gqlModelview);
      break;
    }
    case "New Model":    
      console.log('169', selected);
      const refMetamodelName = (selectedOption) && selectedOption;
      const refMetamodel = myMetis.findMetamodelByName(refMetamodelName);
      
      // myMetis.currentTargetMetamodel = targetMetamodel
      // myMetis.currentModel.targetMetamodelRef = targetMetamodel.id
      if (debug) console.log('175 Diagram', refMetamodel, myMetis);
      // let mmdata = myMetis.currentModel;
      // if (debug) console.log('177 Diagram', mmdata);        
      // myMetis.myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: {mmdata} })
      break;

    case "Set Target Model":    
      const modelName = (selectedOption) && selectedOption;
      const targetModel = myMetis.findModelByName(modelName);
      myMetis.currentTargetModel = targetModel
      myMetis.currentModel.targetModelRef = targetModel.id
      if (debug) console.log('186 Diagram', targetModel, myMetis);
      const mdata = new gql.gqlModel(myMetis.currentModel, true);
      if (debug) console.log('188 Diagram', mdata);        
      myMetis.myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: mdata })
      break;

    case "Set Target Metamodel":    
      const metamodelName = (selectedOption) && selectedOption;
      const targetMetamodel = myMetis.findMetamodelByName(metamodelName);
      myMetis.currentTargetMetamodel = targetMetamodel;
      myMetis.currentModel.targetMetamodelRef = targetMetamodel.id
      if (debug) console.log('197 Diagram', targetMetamodel, myMetis);
      const mmdata = new gql.gqlModel(myMetis.currentModel, true);
      if (debug) console.log('199 Diagram', mmdata);        
      myMetis.myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: mmdata })
      break;

    case "Change Relationship type":    
      typename = (selectedOption) && selectedOption;
      const link = myMetis.currentLink;
      let fromNode = myGoModel?.findNode(link.from);
      let toNode   = myGoModel?.findNode(link.to);
      if (debug) console.log('208 from and toNode', fromNode, toNode);
      let fromType = fromNode?.objecttype;
      let toType   = toNode?.objecttype;
      fromType = myMetis.findObjectType(fromType?.id);
      toType   = myMetis.findObjectType(toType?.id);
      if (debug) console.log('213 link', fromType, toType);
      const reltype = myMetis.findRelationshipTypeByName2(typename, fromType, toType);
      if (debug) console.log('215 reltype', reltype, fromType, toType);
      const relview = (reltype) && uic.setRelationshipType(link, reltype, context);
      if (debug) console.log('217 relview', relview);
      myMetis.myDiagram.requestUpdate();
      break;

    case "Edit Attribute":
      const propname = selected.value;
      if (debug) console.log('223 propname', propname);
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
          if (debug) console.log('242', propname, value);
          if (propname === 'description') {
            inst.description = value;
          } else {
            console.log('246 prop, value', propname, value);
            inst[propname] = value;
          }
          switch(inst.category) {
          case 'Relationship':
            inst = myMetis.findRelationship(inst.id);
            inst[propname] = value;
            if (debug) console.log('253 inst', inst);
            const modifiedRelships = new Array();
            const gqlRel = new gql.gqlRelationship(inst);
            if (debug) console.log('256 inst, gqlRel', inst, gqlRel);
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
              console.log('767 regex:', regex, value);
              if (!regex.test(value)) {
                alert('Value: ' + value + ' IS NOT valid');
                break;
              }
            }
            inst[propname] = value;
            if (debug) console.log('275 inst', inst);
            const modifiedReltypes = new Array();
            const gqlRelType = new gql.gqlRelationshipType(inst, true);
            if (debug) console.log('278 inst, gqlRel', inst, gqlRelType);
            modifiedReltypes.push(gqlRelType);
            modifiedReltypes?.map(mn => {
              let data = (mn) && mn
              myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
            });
            break;
          }
        }
      }
      break;

    default:
      break;
  }
}

export function handleCloseModal(selectedData: any, props: any, modalContext: any) {
  if (debug) console.log('301 selectedData, props', selectedData, props);
  const what = modalContext.what;
  const myDiagram = modalContext.myDiagram;
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
      if (debug) console.log('182 selObj', selObj);
      // selObj is a node representing an objecttype
      let node = selObj;
      let type = node.objecttype;
      node = myDiagram.findNodeForKey(node.key);
      type = myMetis.findObjectType(type.id);
      if (debug) console.log('250 selObj', selObj, type);
      const data = node.data;
      if (debug) console.log('212 node, type', data, type);
      for (let k in selObj) {
        if (typeof(type[k]) === 'object')    continue;
        if (typeof(type[k]) === 'function')  continue;
        if (!uic.isPropIncluded(k, type))    continue;
        type[k] = selObj[k];
        myDiagram.model.setDataProperty(data, k, type[k]);
      }
      // Do the dispatches
      const gqlObjtype = new gql.gqlObjectType(type, true);
      if (debug) console.log('222 gqlObjtype', gqlObjtype);
      modifiedObjtypes.push(gqlObjtype);
      modifiedObjtypes.map(mn => {
        let data = mn;
        props.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
      })
      if (debug) console.log('284 selObj', selObj);
      break;
    }
    case "editRelationshipType": {
      const selObj = selectedData;
      if (debug) console.log('212 selObj', selObj);
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
        if (debug) console.log('226 cardinalities', cardinalityFrom, cardinalityTo);
        type.cardinalityFrom = cardinalityFrom;
        type.cardinalityTo = cardinalityTo;
        reltypeview.setRelshipKind(type.relshipkind);
        if (debug) console.log('229 link', link, type);
        if (debug) console.log('230 link, type', data, type);
      } else 
        break;

      for (let k in selObj) {
        if (typeof(type[k]) === 'object')    continue;
        if (typeof(type[k]) === 'function')  continue;
        if (!uic.isPropIncluded(k, type))    continue;
        type[k] = selObj[k];
        myDiagram.model.setDataProperty(link.data, k, type[k]);
        if (debug) console.log('239 type', type);
      }
      // Do the dispatches
      const gqlReltype = new gql.gqlRelationshipType(type, true);
      if (debug) console.log('237 gqlReltype', type, gqlReltype);
      modifiedReltypes.push(gqlReltype);
      modifiedReltypes.map(mn => {
        let data = mn;
        props.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
      })
      if (debug) console.log('243 selObj', selObj);
      break;
    }
    case "editObject": {
      const selObj = selectedData;
      // selObj is a node representing an objectview
      let node = selObj;
      let obj = selObj.object;
      obj = myMetis.findObject(obj?.id);
      if (debug) console.log('397 selObj', selObj, obj);
      const type = obj?.type;
      // Check if any of the values are NOT VALID
      const properties = type?.properties;
      for (let i=0; i<properties?.length; i++) {
        const prop = properties[i];
        const dtypeRef = prop.datatypeRef;
        const dtype = myMetis.findDatatype(dtypeRef);
        if (dtype) {
          const pattern = dtype.inputPattern;
          const value = obj[prop.name];
          if (debug) console.log('408 value', pattern, value);
          if (pattern && value) {
              const regex = new RegexParser(pattern);
            if (debug) console.log('411 regex:', regex);
            if (!regex.test(value)) {
              const errormsg = "Value: '" + value + "' of '" + prop.name + "' IS NOT valid"
              alert(errormsg);
              return;
            }
          }
        }
      }
      if (debug) console.log('420 node', node);
      node = myDiagram.findNodeForKey(node.key)
      const data = node.data;
      if (debug) console.log('423 node', node);
      for (let k in data) {
        if (typeof(obj[k]) === 'object')    continue;
        if (typeof(obj[k]) === 'function')  continue;
        if (!uic.isPropIncluded(k, type))   continue;
        if (k === 'abstract') obj[k] = selObj[k];
        if (k === 'viewkind') obj[k] = selObj[k];
        if (debug) console.log('430 prop', k);
        if (debug) console.log('431 node', node, data, obj);
        myDiagram.model.setDataProperty(data, k, obj[k]);
      }
      const myGoModel = myMetis.gojsModel;
      const myNode = myGoModel.findNode(node.key);
      myNode.name = data.name;
      if (debug) console.log('438 myNode, myMetis', myNode, myMetis);
      const gqlObject = new gql.gqlObject(obj);
      if (debug) console.log('440 gqlObject', gqlObject);
      modifiedObjects.push(gqlObject);
      // Do the dispatches
      modifiedObjects.map(mn => {
        let data = mn;
        props.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
      })
      modifiedObjviews.map(mn => {
        let data = mn;
        if (debug) console.log('444 gqlObjview', data);
        props.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
      })
      if (debug) console.log('447 selObj', selObj);
    break;
    }
    case "editRelationship": {
      const rel = selectedData;
      const type = rel.type;
      const link = myDiagram.findLinkForKey(rel.key);
      if (!link)
        break;
      if (debug) console.log('320 rel, link', rel, link);
      const data = link.data;
      if (debug) console.log('322 data', data);
      let relship = data.relship;
      relship = myMetis.findRelationship(relship.id);
      relship['cardinalityFrom'] = relship.getCardinalityFrom();
      relship['cardinalityTo'] = relship.getCardinalityTo();
      // relship.cardinalityTo = relship.cardinality;
      if (debug) console.log('327 relship, rel', relship, rel);
      for (let k in rel) {
        if (typeof(rel[k]) === 'object')    continue;
        if (typeof(rel[k]) === 'function')  continue;
        if (!uic.isPropIncluded(k, type))  continue;
        myDiagram.model.setDataProperty(data, k, relship[k]);
      }
      const gqlRelship = new gql.gqlRelationship(relship);
      if (debug) console.log('340 gqlRelship', gqlRelship);
      modifiedRelships.push(gqlRelship);
      modifiedRelships.map(mn => {
        let data = mn;
        props.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
      });
      let relview = link.data.relshipview;
      relview = myMetis.findRelationshipView(relview.id);
      if (relship.relshipkind) {
        relview.setFromArrow2(relship.relshipkind);
        relview.setToArrow2(relship.relshipkind);
        myDiagram.model.setDataProperty(data, 'fromArrow', relview.fromArrow);
        myDiagram.model.setDataProperty(data, 'toArrow', relview.toArrow);
        myDiagram.model.setDataProperty(data, 'fromArrowColor', relview.fromArrowColor);
        myDiagram.model.setDataProperty(data, 'toArrowColor', relview.toArrowColor);
        if (debug) console.log('351 relship, relview', relship, relview);
      }
      if (myModelview.showCardinality) {
        myDiagram.model.setDataProperty(data, 'cardinalityFrom', relship.getCardinalityFrom());
        myDiagram.model.setDataProperty(data, 'cardinalityTo', relship.getCardinalityTo());
        if (debug) console.log('354 myModelview', myModelview);
      } else {
        myDiagram.model.setDataProperty(data, 'cardinalityFrom', '');
        myDiagram.model.setDataProperty(data, 'cardinalityTo', '');
      }
      const gqlRelview = new gql.gqlRelshipView(relview);
      gqlRelview.name = gqlRelship.name;
      if (debug) console.log('355 gqlRelview', gqlRelview);
      modifiedRelviews.push(gqlRelview);
      modifiedRelviews.map(mn => {
        let data = mn;
        if (debug) console.log('341 gqlRelview', data);
        props.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      })        
      break;
    }
    case "editObjectview": {
      let selObjview = selectedData;
      if (debug) console.log('312 selObjview', selObjview);
      const objview = selObjview.objectview;
      if (!objview)
        break;
      const objtypeview = objview.typeview;
      if (debug) console.log('318 objview, objtypeview', selObjview, objview, objtypeview);
      const node = myDiagram.findNodeForKey(selObjview.key);
      if (debug) console.log('320 node', node, selObjview);
      const data = node.data;
      for (let prop in  objtypeview?.data) {
        objview[prop] = selObjview[prop];
      }
      const gqlObjview = new gql.gqlObjectView(objview);
      if (debug) console.log('326 gqlObjview', data, gqlObjview);
      modifiedObjviews.push(gqlObjview);
      modifiedObjviews.map(mn => {
        let data = mn;
        if (debug) console.log('330 data', data);
        props.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
      })
      if (debug) console.log('353 data', data);
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
          if (debug) console.log('544 node', node);
          const data = node.data;
          const objview = data.objectview;
          if (objview) {
            objview.icon = data.icon;
            const gqlObjview = new gql.gqlObjectView(data.objectview);
            if (debug) console.log('550 gqlObjview', data, gqlObjview);
            modifiedObjviews.push(gqlObjview);
            modifiedObjviews.map(mn => {
              let data = mn;
              if (debug) console.log('554 data', data);
              props.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
            })
            for (let prop in objview?.data) {
              if (prop === 'icon' && objview[prop] !== "") 
              myDiagram.model.setDataProperty(data, prop, objview[prop]);
            }
          }
        } else if (selectedData.category === constants.gojs.C_OBJECTTYPE) {
          const node = selectedData;
          if (debug) console.log('564 node', node);
          let objtype = node.objecttype;
          objtype = myMetis.findObjectType(objtype.id);
          const objtypeview = objtype.typeview;
          objtypeview.icon = node.icon;
          objtypeview.data.icon = node.icon;
          const gqlObjtypeview = new gql.gqlObjectTypeView(objtypeview);
          if (debug) console.log('571 gqlObjtypeview', objtypeview, gqlObjtypeview);
          modifiedObjTypeviews.push(gqlObjtypeview);
          modifiedObjTypeviews.map(mn => {
            let data = mn;
            props.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
          })
        }
      }
      break;
    }
    case "editRelshipview": {
      let selRelview = selectedData;
      const relview = selRelview.relshipview;
      if (!relview)
        break;
      const reltypeview = relview.typeview;
      if (debug) console.log('362 relview, reltypeview', selRelview, relview, reltypeview);
      const link = myDiagram.findLinkForKey(selRelview.key);
      const data = link.data;
      for (let prop in  reltypeview?.data) {
        relview[prop] = selRelview[prop];
      }
      const gqlRelview = new gql.gqlRelshipView(relview);
      if (debug) console.log('365 data, gqlRelview', link, data, gqlRelview);
      modifiedRelviews.push(gqlRelview);
      modifiedRelviews.map(mn => {
        let data = mn;
        props.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      })
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
      break;
    }
    case "editTypeview": {   
      const selObj = selectedData;
      if (debug) console.log('449 selObj', selObj);
      let inst, data, typeview;
      if (selObj.category === constants.gojs.C_OBJECTTYPE) {
        let node = myMetis.currentNode;
        node = myDiagram.findNodeForKey(node.key);
        data = node.data;
        if (debug) console.log('455 node, data', node, data);
        typeview = data.typeview;
        typeview = myMetis.findObjectTypeView(typeview?.id);
        let objtype = node.objecttype;
        if (!typeview) typeview = objtype.newDefaultTypeView('Object');
        for (let prop in typeview?.data) {
          typeview.data[prop] = selObj[prop];
          typeview[prop] = selObj[prop];
        }
        if (debug) console.log('461 typeview', typeview, data);
         const gqlObjtypeview = new gql.gqlObjectTypeView(typeview);
        if (debug) console.log('463 gqlObjtypeview', gqlObjtypeview);
        modifiedObjTypeviews.push(gqlObjtypeview);
        modifiedObjTypeviews.map(mn => {
          let data = mn;
          props.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
        })
      }
      if (selObj.category === constants.gojs.C_OBJECT) {
        const node = myDiagram.findNodeForKey(selObj.key);
        data = node.data;
        if (debug) console.log('284 objtypeview, data', data);
        typeview = data.objectview?.typeview;
        typeview = data.typeview;
        typeview = myMetis.findObjectTypeView(typeview.id);
        const gqlObjtypeview = new gql.gqlObjectTypeView(typeview);
        if (debug) console.log('287 gqlObjtypeview', gqlObjtypeview);
        modifiedObjTypeviews.push(gqlObjtypeview);
        modifiedObjTypeviews.map(mn => {
          let data = mn;
          props.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
        })
      }
      if (selObj.category === constants.gojs.C_RELSHIPTYPE) {
        const link = myDiagram.findLinkForKey(selObj.key);
        data = link.data;
        if (debug) console.log('377 data', data);
        typeview = data.typeview;
        typeview = myMetis.findRelationshipTypeView(typeview.id);
        for (let prop in typeview.data) {
          typeview.data[prop] = selObj[prop];
          data[prop] = selObj[prop];
        }
        typeview.setFromArrow2(selObj.relshipkind);
        typeview.setToArrow2(selObj.relshipkind);
        if (debug) console.log('384 typeview', typeview, data);
        const gqlReltypeview = new gql.gqlRelshipTypeView(typeview);
        if (debug) console.log('386 gqlReltypeview', gqlReltypeview);
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
        if (debug) console.log('294 reltypeview, link', typeview, link);
        const gqlReltypeview = new gql.gqlRelshipTypeView(typeview);
        if (debug) console.log('296 gqlReltypeview', gqlReltypeview);
        modifiedRelTypeviews.push(gqlReltypeview);
        modifiedRelTypeviews.map(mn => {
          let data = mn;
          props.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
        })
      }
      if (data) {
        if (debug) console.log('518 data', data);
        for (let prop in typeview) {
          if (prop === 'figure' && typeview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, typeview[prop]);
          if (prop === 'fillcolor' && typeview[prop] !== "") {
            if (debug) console.log('524 fillcolor', typeview[prop]);
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
    // Handle all the dispatches
    modifiedObjTypeviews.map(mn => {
      let data = mn;
      props.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
    })
  }
}

