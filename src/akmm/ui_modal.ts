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
const RegexParser = require("regex-parser");

export function handleInputChange(myMetis: akm.cxMetis, props: any, value: string) {
  if (debug) console.log('16 ui_modal: props, value', props, value);
  const propname = props.id;
  const fieldType = props.type;
  const obj = props.obj;
  const context = props.context;
  const pattern = props.pattern;
  if (debug) console.log('22 obj, context:', obj, context);
  if (debug) console.log('23 propname, value:', propname, value);
  // const myDiagram = context.myDiagram;
  let inst, instview, typeview, myInst, myInstview, myItem;
  // Handle object types
  if (obj.category === constants.gojs.C_OBJECTTYPE) {
    const node = obj;
    if (debug) console.log('27 node', node);
    inst = node.objecttype;
    typeview = node.typeview;

    if (context?.what === "editType") {
      myItem = inst;
    } else if (context?.what === "editTypeview") {
        myItem = typeview; 
        if (debug) console.log('37 editTypeview', myItem);
    }    

    try {
        myItem[propname] = value;
      } catch {
        // Do nothing
    }
    if (debug) console.log('45 myItem', myItem);
  }
    // Handle objects
  if (obj.category === constants.gojs.C_OBJECT) {
    const node = obj;
    inst = node.object ? node.object : node;
    instview = node.objectview;
    myInst = myMetis.findObject(inst.id);
    if (!myInst) myInst = obj;
    myInstview = myMetis.findObjectView(instview?.id);
    typeview = inst?.type?.typeview;
    if (myInstview) {
      for (let prop in typeview?.data) {
        myInstview[prop] = obj[prop];
      }
    }
    if (debug) console.log('68 inst, myInst', inst, myInst);
    if (context?.what === "editObjectview") {
        myItem = myInstview;
    } else if (context?.what === "editTypeview") {
        myItem = myInst.type?.typeview; 
        if (debug) console.log('73 editTypeview', typeview, myItem);
    } else {
        myItem = myInst;
    }
    if (debug) console.log('77 myItem, propname, value', myItem, propname, value);
    try {
      myItem[propname] = value;
    } catch {
      // Do nothing
    }
  }
  if (debug) console.log('84 myItem', myItem);

  // Handle relationship types
  if (obj.category === constants.gojs.C_RELSHIPTYPE) {
    const link = obj;
    if (debug) console.log('89 link', link);
    inst = link.reltype;
    typeview = link.reltype;

    if (context?.what === "editType") {
      myItem = inst;
    } else if (context?.what === "editTypeview") {
        myItem = typeview; 
        if (debug) console.log('97 editTypeview', typeview);
    } 
    try {
      myItem[propname] = value;
    } catch {
      // Do nothing
    }
  }
  // Handle relationships
  if (obj.category === constants.gojs.C_RELATIONSHIP) {
      const link = obj;
      inst = link.relship;
      myInst = myMetis.findRelationship(inst?.id);
      instview = link.relshipview;
      myInstview = myMetis.findRelationshipView(instview?.id);    
      if (debug) console.log('112 myInst', myInst, myInstview);
      if (context?.what === "editRelshipview") 
          myItem = myInstview;
      else if (context?.what === "editTypeview") {
          if (debug) console.log('109 myInst', myInst);
          myItem = myInst?.type?.typeview?.data;
      } else
          myItem = myInst;
      if (myItem) 
          myItem[propname] = value;
      if (debug) console.log('120 myItem', myItem);    
  }
  if (debug) console.log('122 myMetis', myMetis);
}

export function handleSelectDropdownChange(selected, context) {
  if (debug) console.log('122 selected, context:', selected, context);
  const myDiagram = context.myDiagram;
  const myMetis = context.myMetis as akm.cxMetis;
  const myMetamodel = context.myMetamodel;
  const myGoModel = context.myGoModel;
  const myModel = context.myModel;
  const myModelview = context.myModelview;
  const modalContext = context.modalContext;
  modalContext.selected = selected;
  modalContext.myMetamodel = myMetamodel;
  const selectedOption = selected.value;
  if (debug) console.log('133 modalContext', modalContext);
  switch(modalContext.case) {
    case "Change Object type": {
      if (debug) console.log('136 selection', myDiagram.selection);
      const typename = (selectedOption) && selectedOption;
      const objtype = myMetis.findObjectTypeByName(typename);
      if (debug) console.log('139 objtype', objtype);
      myDiagram.selection.each(function(sel) {
        const inst = sel.data;
        if (debug) console.log('143 inst', inst);
        if (inst.category === constants.gojs.C_OBJECT) {
          const obj = inst.object;
          obj.type = objtype;
          let objview = inst.objectview;
          objview = (objtype) && uic.setObjectType(inst, objtype, context);
          const node = myGoModel.findNodeByViewId(objview.id);
          if (debug) console.log('149 objview, node, myGoModel', objview, node, myGoModel);
          const n = myDiagram.findNodeForKey(inst.key);
          // const data = n.data;
          myDiagram.model.setDataProperty(n.data, "typename", typename);
          uid.resetToTypeview(inst, myMetis, myDiagram);
          myMetis.myDiagram.requestUpdate();
        }
      });
      break;
    }
    case "Connect to Selected": {
      const myMetamodel = context.myMetamodel;
      const nodeFrom = modalContext.args.nodeFrom;
      const nodesTo  = modalContext.args.nodesTo;
      const links = [];
      for (let i=0; i<nodesTo.length; i++) {
        let nodeTo = nodesTo[i];
        if (nodeTo) {
          let fromType = nodeFrom.objecttype;
          fromType = myMetis.findObjectType(fromType.id);
          let toType   = nodeTo.objecttype;
          if (!toType)
            continue;
          toType = myMetis.findObjectType(toType.id);
          const typename = (selectedOption) && selectedOption;
          const reltype  = myMetis.findRelationshipTypeByName2(typename, fromType, toType);
          if (debug) console.log('166 fromType, toType, reltype', fromType, toType, reltype);
          // create a link data between the actual nodes
          let linkdata = {
            key:    utils.createGuid(),
            from:   myDiagram.model.getKeyForNodeData(nodeFrom),  // or just: fromData.id
            to:     myDiagram.model.getKeyForNodeData(nodeTo),
            name:   typename,
          };
          // set the link attributes
          const rtviewdata = reltype?.typeview?.data;
          for (let prop in rtviewdata) {
            if (prop === 'id') continue;
            if (prop === 'name') continue;
            if (prop === 'abstract') continue;
            if (prop === 'class') continue;
            if (prop === 'relshipkind') continue;
            linkdata[prop] = rtviewdata[prop];
          }
          links.push(linkdata);
          if (debug) console.log('189 linkdata', linkdata);
          // and add the link data to the model
          myDiagram.model.addLinkData(linkdata);
        }
      }
      if (debug) console.log('193 links', links);
      modalContext.links = links;
      break;
    }
    case "Change Icon": {
      const icon = (selectedOption) && selectedOption;
      myDiagram.selection.each(function(sel) {
        const inst = sel.data;
        if (inst.category === constants.gojs.C_OBJECT) {
          let objview = inst.objectview;
          if (debug) console.log('206 objview', objview, node, myMetis);
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
              if (debug) console.log('219 data', data);
              data = JSON.parse(JSON.stringify(data));
              if (debug) console.log('221 data, jsnObjview', data, jsnObjview);
              myMetis.myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
            });
          }
        }
        else if (inst.category === constants.gojs.C_OBJECTTYPE) {
          let node = myMetis.currentNode;
          const icn = myDiagram.findNodeForKey(node.key);
          let idata = icn.data;
          myDiagram.model.setDataProperty(idata, "icon", icon);
          myDiagram.requestUpdate();
          if (debug) console.log('236 node, data', node, idata);
          let objtypeview = node.typeview;
          objtypeview = myMetis.findObjectTypeView(objtypeview?.id);
          if (debug) console.log('239 objtypeview', objtypeview);
          myDiagram.model.setDataProperty(node, "icon", icon);
          if (debug) console.log('241 objtypeview', objtypeview);
          if (objtypeview) {
            objtypeview.icon = icon;
            objtypeview.data.icon = icon;
            if (debug) console.log('245 objtypeview, icon', objtypeview, icon);
            const jsnObjtypeview = new jsn.jsnObjectTypeView(objtypeview);
            const modifiedObjtypeviews = [];
            modifiedObjtypeviews.push(jsnObjtypeview);
            modifiedObjtypeviews.map(mn => {
              let data = mn;
              if (debug) console.log('251 data', data);
              data = JSON.parse(JSON.stringify(data));
              if (debug) console.log('253 data, jsnObjtypeview', data, jsnObjtypeview);
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
        if (debug) console.log('141 jsnModelview', jsnModelview);
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
        if (debug) console.log('151 jsnMetamodel', jsnMetamodel);
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
        const jsnModelview = new jsn.jsnModelView(myModelview);
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        })
        if (debug) console.log('173 jsnModelview', jsnModelview);
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
        if (debug) console.log('183 jsnMetamodel', jsnMetamodel);
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
      if (debug) console.log('196 link curve', linkcurve);
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
        if (debug) console.log('206 jsnModelview', jsnModelview);
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
        if (debug) console.log('216 jsnMetamodel', jsnMetamodel);
      }
      break;
    }
    case "New Model": {
      if (debug) console.log('222', selected);
      const refMetamodelName = (selectedOption) && selectedOption;
      const refMetamodel = myMetis.findMetamodelByName(refMetamodelName);
      if (debug) console.log('228 Diagram', refMetamodel, myMetis);
      break;
    } 
    case "Set Target Model": { 
      const modelName = (selectedOption) && selectedOption;
      const targetModel = myMetis.findModelByName(modelName);
      myMetis.currentTargetModel = targetModel
      myMetis.currentModel.targetModelRef = targetModel.id
      if (debug) console.log('240 Diagram', targetModel, myMetis);
      let mdata = new jsn.jsnModel(myMetis.currentModel, true);
      mdata = JSON.parse(JSON.stringify(mdata));
      if (debug) console.log('242 Diagram', mdata);        
      myMetis.myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: mdata })
      break;
    }
    case "Set Target Metamodel":   
    case "Generate Target Metamodel": {
      const metamodelName = (selectedOption) && selectedOption;
      const targetMetamodel = myMetis.findMetamodelByName(metamodelName);
      // myMetis.currentTargetMetamodel = targetMetamodel;
      myMetis.currentModel.targetMetamodelRef = targetMetamodel?.id
      if (debug) console.log('253 Diagram', targetMetamodel, myMetis);
      let mmdata = new jsn.jsnModel(myMetis.currentModel, true);
      mmdata = JSON.parse(JSON.stringify(mmdata));
      if (debug) console.log('255 Diagram', mmdata);        
      myMetis.myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: mmdata });
      break;
    }
    case "Change Relationship type": { 
      const typename = (selectedOption) && selectedOption;
      myDiagram.selection.each(function(sel) {
        const link = sel.data;
        if (link.category === constants.gojs.C_RELATIONSHIP) {
          if (!link) return;
          let relship = link.relship;
          relship = myModel.findRelationship(relship.id);
          let relshipview = link.relshipview;
          relshipview = myModelview.findRelationshipView(relshipview.id);
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
            const jsnRel = new jsn.jsnRelationship(inst);
            if (debug) console.log('314 inst, jsnRel', inst, jsnRel);
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
              console.log('326 regex:', regex, value);
              if (!regex.test(value)) {
                alert('Value: ' + value + ' IS NOT valid');
                break;
              }
            }
            inst[propname] = value;
            if (debug) console.log('333 inst', inst);
            const modifiedReltypes = new Array();
            const jsnRelType = new jsn.jsnRelationshipType(inst, true);
            if (debug) console.log('336 inst, jsnRel', inst, jsnRelType);
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
      const data = modalContext.data;
      const typename = selected.value;
      modalContext.selected = selected;
      const fromNode = myGoModel.findNode(modalContext.data.from);
      const fromPortId = modalContext.data.fromPort;
      const toNode = myGoModel.findNode(modalContext.data.to);
      const toPortId = modalContext.data.toPort;
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
      if (!reltype) {
        reltype = myMetis.findRelationshipTypeByName2(typename, fromType, toType);
        if (!reltype) {
          alert("Relationship type given does not exist!")
          myDiagram.model.removeLinkData(data);
          return;
        }
      }
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
      data.relshiptype = reltype;
      break;
    }
    default:
      break;
  }
}

export function handleCloseModal(selectedData: any, props: any, modalContext: any) {
  if (debug) console.log('540 selectedData, props, modalContext: ', selectedData, props, modalContext);
  if (debug) console.log('541 selectedData.objecttype: ', selectedData.objecttype);
  if (debug) console.log('542 props.nodedataArray[0].objecttype: ', props.nodeDataArray[0].objecttype);
  const what = modalContext.what;
  let myDiagram = modalContext.myDiagram;
  if (myDiagram && modalContext.context) myDiagram = modalContext.context.myDiagram;
  const selection = myDiagram.selection;
  if (debug) console.log('547 selection', selection);
  const myMetis = props.myMetis as akm.cxMetis;
  if (debug) console.log('549 myMetis', myMetis);
  const myMetamodel = myMetis.currentMetamodel;
  const myModel     = myMetis.currentModel;
  const myModelview = myMetis.currentModelview;
  const myGoModel   = myMetis.gojsModel;
  // Prepare for dispatches
  const modifiedObjtypes     = new Array();    
  const modifiedReltypes     = new Array();    
  const modifiedObjTypeviews = new Array();    
  const modifiedRelTypeviews = new Array();    
  // const modifiedObjviews     = new Array();    
  const modifiedRelviews     = new Array();    
  const modifiedObjects      = new Array();    
  // const modifiedRelships     = new Array();    
  // const modifiedModels       = new Array();    
  const modifiedModelviews   = new Array();    
  switch(what) {
    case "editObjectType": {
      const selObj = selectedData;
      if (debug) console.log('588 selObj', selObj);
      // selObj is a node representing an objecttype
      let node = selObj;
      node = myDiagram.findNodeForKey(node.key);
      let type = selObj.objecttype;
      type = myMetis.findObjectType(type.id);
      if (debug) console.log('594 selObj', selObj, type);
      const data = node.data;
      if (debug) console.log('596 node, type', data, type);
      for (let k in type) {
        if (k === 'id') continue;
        if (typeof(type[k]) === 'object')    continue;
        if (typeof(type[k]) === 'function')  continue;
        if (!uic.isPropIncluded(k, type))    continue;
        type[k] = selObj[k];
        if (debug) console.log('603 k, selObj[k]', k, selObj[k]);
        myDiagram.model.setDataProperty(data, k, type[k]);
      }
      // Do the dispatches
      const jsnObjtype = new jsn.jsnObjectType(type, true);
      if (debug) console.log('608 jsnObjtype', jsnObjtype);
      modifiedObjtypes.push(jsnObjtype);
      modifiedObjtypes.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
      })
      if (debug) console.log('615 type, selObj', type, selObj);
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
        if (reltypeview) {
          reltypeview.setRelshipKind(type.relshipkind);
          reltypeview.setTemplate(data.template);
        }
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
      const jsnReltype = new jsn.jsnRelationshipType(type, true);
      if (debug) console.log('482 jsnReltype', type, jsnReltype);
      modifiedReltypes.push(jsnReltype);
      modifiedReltypes.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
      })
      if (debug) console.log('488 selObj', selObj);
      break;
    }
    case "editPort": {
      // selObj is a node representing an object with ports
      const selObj = selectedData;
      if (debug) console.log('679 selObj', selObj, myMetis);

      break;
    }
    case "editObject": {
      // selObj is a node representing an object or an objectview
      const selObj = selectedData;
      if (debug) console.log('576 selObj', selObj, myMetis);
      // Do a fix
      const oview = myMetis.findObjectView(selObj.objectview.id);
      oview.group = selObj.objectview?.group;
      myMetis.addObjectView(oview);
      // End fix
      let node = selObj;
      let obj;
      if (selObj.object) {
        obj = selObj.object;
        obj = myMetis.findObject(obj?.id);
      } else {
        obj = selObj;
      }
      if (!obj)
        break;
      const type = obj?.type;
      if (debug) console.log('589 selObj, obj, type', selObj, obj, type);
      let properties;
      if (type?.name === 'Method') {
        properties = obj.setAndGetAllProperties(myMetis);
      } else if (type?.name === 'Modelview') {
        // This should be moved to case: "editModelview"
        const mv = myMetis.findModelView(obj.modelviewId);
        if (mv) {
          properties = type?.getProperties(false);
          if (debug) console.log('700 type, properties', type, properties);
          for (let i=0; i<properties?.length; i++) {
            const prop = properties[i];
            if (!prop)
              continue;
            switch(prop.name) {
              case 'layout':
              case 'link curve':
              case 'link routing':
              case 'askForRelshipName':
              case 'includeInheritedReltypes':
              case 'UseUMLrelshipkinds':
                mv[prop.name] = obj[prop.name];
            }
          }
          if (debug) console.log('715 mv', mv);
          const jsnModelview = new jsn.jsnModelView(mv);
          modifiedModelviews.push(jsnModelview);
          modifiedModelviews.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
          })
        }
      } else 
        properties = type?.getProperties(false);
      if (debug) console.log('597 properties', properties);
      const jsnObject = new jsn.jsnObject(obj);
      jsnObject["text"] = obj.text;
      if (debug) console.log('600 obj, jsnObject', obj, jsnObject);
      for (let i=0; i<properties?.length; i++) {
        const prop = properties[i];
        if (!prop)
          continue;
        const dtypeRef = prop.datatypeRef;
        const dtype = myMetis.findDatatype(dtypeRef);
        if (dtype && dtype.name !== 'boolean') {
          const pattern = dtype.inputPattern;
          const value = obj[prop.name];
          if (pattern && value) {
              const regex = new RegexParser(pattern);
            if (debug) console.log('643 regex:', regex);
            if (!regex.test(value)) {
              const errormsg = "Value: '" + value + "' of '" + prop.name + "' IS NOT valid"
              alert(errormsg);
              return;
            }
          }
        }
        const expr = obj.getPropertyValue(prop, myMetis);
        obj[prop.name] = expr;
        jsnObject[prop.name] = expr;
      }
      if (debug) console.log('625 obj, jsnObject, node', obj, jsnObject, node);
      const n = myDiagram.findNodeForKey(node.key)
      const data = n ? n.data : node.data;
      if (debug) console.log('628 node', node);
      // Special handling of the draft property
      if (node[constants.props.DRAFT]) {
        myDiagram.model.setDataProperty(data, 'typename', node[constants.props.DRAFT]);
        }
      for (let k in data) {
        if (typeof(obj[k]) === 'object')    continue;
        if (typeof(obj[k]) === 'function')  continue;
        if (!uic.isPropIncluded(k, type))   continue;
        if (k === 'abstract') obj[k] = selObj[k];
        // if (k === 'viewkind') obj[k] = selObj[k];
        if (debug) console.log('635 prop', k);
        if (debug) console.log('636 node', node, data, obj, k);
        myDiagram.model.setDataProperty(data, k, obj[k]);
      }
      if (jsnObject) {
        // Do dispatch
        let data = JSON.parse(JSON.stringify(jsnObject));
        if (debug) console.log('912 jsnObject, data', jsnObject, data);
        myMetis.myDiagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
      }
      break;
    }
    case "addPort": {
      const selObj = selectedData;
      if (debug) console.log('779 selObj', selObj);
      break;
    }
    case "editRelationship": {
      const rel = selectedData;
      const type = rel.type;
      const link = myDiagram.findLinkForKey(rel.key);
      if (!link)
        break;
      if (debug) console.log('782 rel, link', rel, link);
      const data = link.data;
      if (debug) console.log('784 data', data);
      let relship = data.relship;
      relship = myMetis.findRelationship(relship.id);
      relship['cardinalityFrom'] = relship.getCardinalityFrom();
      relship['cardinalityTo'] = relship.getCardinalityTo();
      if (relship.name === "") relship.name = " ";
      if (debug) console.log('790 relship, rel', relship, rel);
      for (let k in rel) {
        if (typeof(rel[k]) === 'object')    continue;
        if (typeof(rel[k]) === 'function')  continue;
        if (debug) console.log('794 prop', k);
        if (!uic.isPropIncluded(k, type))  continue;
        if (k === constants.props.DRAFT) {
          myDiagram.model.setDataProperty(data, 'name', rel[k]);
        }
        myDiagram.model.setDataProperty(data, k, relship[k]);
        if (debug) console.log('797 data, k, relship[k]', data, k, relship[k]);
      }
      let relview = link.data.relshipview;
      relview = myMetis.findRelationshipView(relview.id);
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
        myDiagram.model.setDataProperty(data, 'fromArrow', fromArrow);
        myDiagram.model.setDataProperty(data, 'toArrow', toArrow);
        myDiagram.model.setDataProperty(data, 'fromArrowColor', relview.fromArrowColor);
        myDiagram.model.setDataProperty(data, 'toArrowColor', relview.toArrowColor);
      }
      if (debug) console.log('813 relship, relview', relship, relview);
      if (myModelview.showCardinality) {
        myDiagram.model.setDataProperty(data, 'cardinalityFrom', relship.getCardinalityFrom());
        myDiagram.model.setDataProperty(data, 'cardinalityTo', relship.getCardinalityTo());
        if (debug) console.log('817 myModelview', myModelview);
      } else {
        myDiagram.model.setDataProperty(data, 'cardinalityFrom', '');
        myDiagram.model.setDataProperty(data, 'cardinalityTo', '');
      }
      const modifiedRelships = new Array();
      const jsnRelship = new jsn.jsnRelationship(relship);
      modifiedRelships.push(jsnRelship);
      modifiedRelships?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
      });
      const modifiedRelviews = new Array();
      const jsnRelview = new jsn.jsnRelshipView(relview);
      if (debug) console.log('1356 jsnRelview', jsnRelview);
      modifiedRelviews.push(jsnRelview);
      modifiedRelviews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          if (debug) console.log('1314 data', data);
          (mn) && myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      });              
      return;
    }
    case "editObjectview": {
      // selObj is a node representing an object or an objectview
      const selObj = selectedData;
      // Do a fix
      const oview = myMetis.findObjectView(selObj.objectview.id);
      if (!oview)
        break;
      oview.group = selObj.objectview?.group;
      myMetis.addObjectView(oview);
      // End fix
      const objtypeview = oview.typeview;
      myDiagram.selection.each(function(sel) {
        if (debug) console.log('851 sel, sel.data', sel, sel.data);
          let objview = sel.data.objectview;
          if (objview) {
            objview = myMetis.findObjectView(objview.id);
            if (debug) console.log('855 objview, objtypeview', objview, objtypeview);
            for (let prop in  objtypeview?.data) {
              if (prop === 'viewkind') {
                if (objview[prop] === 'Object') {
                  objview['group'] = "";
                  objview['isGroup'] = false;
                } else if (objview[prop] === 'Container') {
                  objview['isGroup'] = true;
                }
              }
              if (prop === 'group') continue;
              if (prop === 'isGroup') {
                if (objview['size'] == "0 0")
                  objview['size'] = "200 100";
                continue;
              }
              try {
                objview[prop] = selObj[prop];
              } catch {}
              if (debug) console.log('870 prop, objview', prop, objview);
              myMetis.addObjectView(objview);
            }
            const obj = objview.object;
            if (obj) obj.viewkind = objview.viewkind;
          }
          const node = myDiagram.findNodeForKey(sel.data.key);
          if (debug) console.log('884 node.data, objview, typeview', node.data, objview, objview.typeview);
          if (node) {
            const data = node.data;
            myDiagram.model.setDataProperty(node, "groupable", objview.isGroup);
            if (debug) console.log('879 objview, data, node', objview, data, node);
            if (debug) console.log('880 model', myDiagram.model);
            for (let prop in objtypeview?.data) {
                myDiagram.model.setDataProperty(data, prop, objview[prop]);
                if (prop === 'viewkind' && objview[prop] !== "") 
                  myDiagram.model.setDataProperty(data, prop, objview[prop]);
                if (prop === 'template' && objview[prop] !== "") 
                  myDiagram.model.setDataProperty(data, prop, objview[prop]);
                if (prop === 'geometry' && objview[prop] !== "") 
                  myDiagram.model.setDataProperty(data, prop, objview[prop]);
                if (prop === 'figure' && objview[prop] !== "") 
                  myDiagram.model.setDataProperty(data, prop, objview[prop]);
                if (prop === 'fillcolor' && objview[prop] !== "") 
                  myDiagram.model.setDataProperty(data, prop, objview[prop]);
                if (prop === 'fillcolor2' && objview[prop] !== "") 
                  myDiagram.model.setDataProperty(data, prop, objview[prop]);
                if (prop === 'strokecolor' && objview[prop] !== "")
                  myDiagram.model.setDataProperty(data, prop, objview[prop]);
                if (prop === 'strokecolor2' && objview[prop] !== "")
                  myDiagram.model.setDataProperty(data, prop, objview[prop]);
                if (prop === 'strokewidth' && objview[prop] !== "")
                  myDiagram.model.setDataProperty(data, prop, objview[prop]);
                if (prop === 'textcolor' && objview[prop] !== "") 
                  myDiagram.model.setDataProperty(data, prop, objview[prop]);
                if (prop === 'textscale' && objview[prop] !== "") 
                  myDiagram.model.setDataProperty(data, prop, objview[prop]);
                if (prop === 'memberscale' && objview[prop] !== "") 
                  myDiagram.model.setDataProperty(data, prop, objview[prop]);
                  if (prop === 'arrowscale' && objview[prop] !== "") 
                  myDiagram.model.setDataProperty(data, prop, objview[prop]);
                if (prop === 'icon' && objview[prop] !== "") 
                  myDiagram.model.setDataProperty(data, prop, objview[prop]);
            }
            if (debug) console.log('906 node, data', node, data);
          }
          myDiagram.requestUpdate;
          // Do dispatch
          const jsnObjview = new jsn.jsnObjectView(objview);
          let data = JSON.parse(JSON.stringify(jsnObjview));
          if (debug) console.log('912 jsnObjview, data', jsnObjview, data);
          myMetis.myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
          return;
      })
      break;
    }
    case "selectDropdown": {
      if (modalContext.title === 'Select Icon') {
        if (selectedData.category === constants.gojs.C_OBJECT) {
          const selObj = selectedData;
          const node = myDiagram.findNodeForKey(selObj.key);
          if (debug) console.log('747 node', node);
          const data = node.data;
          const objview = data.objectview;
          if (objview) {
            objview.icon = data.icon;
            const jsnObjview = new jsn.jsnObjectView(data.objectview);
            const modifiedObjviews = new Array();    
            modifiedObjviews.push(jsnObjview);
            modifiedObjviews.map(mn => {
              let data = mn;
              if (debug) console.log('769 data', data);
              data = JSON.parse(JSON.stringify(data));
              if (debug) console.log('771 data, jsnObjview', data, jsnObjview);
              myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
            });
          }
          for (let prop in objview?.data) {
            if (prop === 'icon' && objview[prop] !== "") 
              myDiagram.model.setDataProperty(data, prop, objview[prop]);
          }
          
        } else if (selectedData.category === constants.gojs.C_OBJECTTYPE) {
          const node = selectedData;
          if (debug) console.log('834 node', node);
          let objtype = node.objecttype;
          objtype = myMetis.findObjectType(objtype.id);
          const objtypeview = objtype.typeview;
          objtypeview.icon = node.icon;
          objtypeview.data.icon = node.icon;
          const jsnObjtypeview = new jsn.jsnObjectTypeView(objtypeview);
          if (debug) console.log('841 jsnObjtypeview', objtypeview, jsnObjtypeview);
          modifiedObjTypeviews.push(jsnObjtypeview);
          modifiedObjTypeviews.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
          })
        }
      }
      else if (modalContext.case === 'New Model') {
        // Selected metamodel
        const selectedValue = modalContext.selected?.value;
        if (debug) console.log('853 selected: ', modalContext.selectedValue);
        const metamodel = myMetis.findMetamodelByName(selectedValue); 
        const context = modalContext.context;
        context.args.metamodel = metamodel;
        modalContext.context.postOperation(context);        
      }
      else if (modalContext.case === 'Generate Target Metamodel') {
        const context = modalContext.context;
        const selectedValue = modalContext.selected?.value;
        if (debug) console.log('862 selected: ', modalContext.selectedValue);
        const metamodel = myMetis.findMetamodelByName(selectedValue); 
        if (!metamodel) {
          alert ('Metamodel not found');
          return;
        }
        context.myTargetMetamodel = metamodel;
        context.myCurrentModelview = myMetis.currentModelview;
        myMetis.currentModel.targetMetamodelRef = metamodel.id;
        if (debug) console.log('874 context', context);
        modalContext.context.postOperation(context);        
      } 
      else if (modalContext.case === 'Add Metamodel') {
        if (debug) console.log('950 modalContext', modalContext);
        const context = modalContext.context;
        const selectedValue = modalContext.selected?.value;
        let metamodel = myMetis.findMetamodelByName(selectedValue); ;
        const metamodels = context.args.metamodels;
        for (let i=0; i<metamodels?.length; i++) {
          const mm = metamodels[i];
          if (mm.name === selectedValue)
              metamodel = mm;
        }
        if (debug) console.log('960 metamodel, modalContext: ', metamodel, modalContext);
        context.args.metamodel = metamodel;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Replace Metamodel') {
        if (debug) console.log('821 modalContext', modalContext);
        const context = modalContext.context;
        const selectedValue = modalContext.selected?.value;
        let metamodel = myMetis.findMetamodelByName(selectedValue); ;
        const metamodels = context.args.metamodels;
        for (let i=0; i<metamodels?.length; i++) {
          const mm = metamodels[i];
          if (mm.name === selectedValue)
              metamodel = mm;
        }
        if (debug) console.log('872 metamodel, modalContext: ', metamodel, modalContext);
        context.args.metamodel = metamodel;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Delete Metamodel') {
        const selectedValue = modalContext.selected?.value;
        const metamodel = myMetis.findMetamodelByName(selectedValue); 
        if (debug) console.log('881 metamodel, modalContext: ', metamodel, modalContext);
        const context = modalContext.context;
        context.args.metamodel = metamodel;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Clear Metamodel') {
        const selectedValue = modalContext.selected?.value;
        const metamodel = myMetis.findMetamodelByName(selectedValue); 
        if (debug) console.log('881 metamodel, modalContext: ', metamodel, modalContext);
        const context = modalContext.context;
        context.args.metamodel = metamodel;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Delete Model') {
        const selectedValue = modalContext.selected?.value;
        const model = myMetis.findModelByName(selectedValue); 
        if (debug) console.log('890 model, modalContext: ', model, modalContext);
        const context = modalContext.context;
        context.args.model = model;
        modalContext.context.postOperation(context);        
        break;
      }
      else if (modalContext.case === 'Generate Method') {
        const myMetamodel = modalContext.context.myMetamodel;
        const selectedValue = modalContext.selected?.value;
        const mtype = myMetamodel.findMethodTypeByName(selectedValue); 
        if (debug) console.log('900 methodType, modalContext: ', mtype, modalContext);
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
        if (debug) console.log('910 method, modalContext: ', mtd, modalContext);
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
        if (debug) console.log('1063 selectedValue', selectedValue);
        // const context = modalContext.context;
        if (debug) console.log('1065 modalContext', modalContext);
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
        if (debug) console.log('1085 node', node);
        name = prompt('Enter port name', name);
        let port = object.getPort(side, name);
        if (port) {
          alert('The port ' + name + ' on side ' + side + ' already exists\n Aborted');
        } else {
          port = object.addPort(side, name);
          if (debug) console.log('1087 object, port', object, port);
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
        link.relshiptype = reltype;
        link.name = reltype.name;
        myDiagram.model.setDataProperty(link.data, 'name', link.name);
      }
      break;
    }
    case "editRelshipview": {
      // selRel contains the changed values
      const selRel = selectedData;
      let selRelview = selRel.relshipview;
      if (!selRelview)
        break;
      let reltypeview = selRel.relshipview.typeview;
      if (debug) console.log('982 reltypeview', reltypeview);
      const rtypeview = myMetis.findRelationshipTypeView(reltypeview.id);
      if (rtypeview) reltypeview = rtypeview;
      if (debug) console.log('984 reltypeview', reltypeview);
      myDiagram.selection.each(function(sel) {
        let relview = sel.data.relshipview;
        if (relview) {
          relview = myMetis.findRelationshipView(relview.id);
          if (relview) {
            for (let prop in reltypeview?.data) {
              if (prop === 'class') continue;
              try {
                relview[prop] = selRel[prop];
              } catch {}
              if (debug) console.log('803 prop, relview', prop, relview);
            }
            myMetis.addRelationshipView(relview);
          }
        }
        const link = myDiagram.findLinkForKey(sel.data.key);
        if (debug) console.log('977 link', link, sel.data);
        if (link && relview) {         
          const data = link.data;
          if (debug) console.log('979 data, relview', data, relview);
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
        if (debug) console.log('1006 data, jsnRelview', link, data, relview, jsnRelview);
        modifiedRelviews.push(jsnRelview);
        modifiedRelviews.map(mn => {
          let data = mn;
          myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
        })
      });
      break;
    }
    case "editTypeview": {   
      // selObj is a node representing an object or an objecttype
      const selObj = selectedData;
      // Do a fix
      if (selObj.typeview) {
        const tview = myMetis.findObjectTypeView(selObj.typeview.id);
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
        typeview = myMetis.findObjectTypeView(objtypeview?.id);
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
        objtypeview = myMetis.findObjectTypeView(objtypeview?.id);
        if (debug) console.log('950 selObj, objtypeview, data', selObj, objtypeview, data);
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
        if (debug) console.log('1035 data, link, myMetis', data, link, myMetis);
        let reltype = data.reltype;
        reltype = myMetis.findRelationshipType(reltype.id);
        if (reltype) {
          typeview = reltype.typeview;
          typeview = myMetis.findRelationshipTypeView(typeview.id);
          reltype.typeview = typeview;
        } else {
          reltypeview = data.typeview;
          typeview = myMetis.findRelationshipTypeView(reltypeview.id);
        }
        if (debug) console.log('1123 selObj, reltype, typeview', selObj, reltype, typeview);
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
          if (debug) console.log('1309 typeview', typeview, data);
          myMetamodel.addRelationshipTypeView(typeview);
          myMetis.addRelationshipTypeView(typeview);
          const jsnReltypeview = new jsn.jsnRelshipTypeView(typeview);
          if (debug) console.log('1313 jsnReltypeview', jsnReltypeview);
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
            if (debug) console.log('1019 reltypeview, data', typeview, data);
            if (debug) console.log('1020 typeview', typeview);
            myMetis.addRelationshipTypeView(typeview);
            const jsnReltypeview = new jsn.jsnRelshipTypeView(typeview);
            if (debug) console.log('1024 jsnReltypeview', jsnReltypeview);
            modifiedRelTypeviews.push(jsnReltypeview);
            modifiedRelTypeviews.map(mn => {
              let data = mn;
              myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
            })
          }
        }
        relview = uic.updateRelationshipView(relview);
        const jsnRelview = new jsn.jsnRelshipView(relview);
        if (debug) console.log('1036 data, elview, , jsnRelview', data, relview, jsnRelview);
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
      if (debug) console.log('1131 modalContext', modalContext);
      const typename = modalContext.selected.value;
      let nodeFrom = modalContext.args.nodeFrom;
      nodeFrom = myDiagram.findNodeForKey(nodeFrom.key);
      const links = modalContext.links;
      if (debug) console.log('1135 links', links);
      let objFrom = nodeFrom.data.object;
      objFrom = myMetis.findObject(objFrom.id);
      let objfromView = nodeFrom.data.objectview;
      objfromView = myMetis.findObjectView(objfromView.id);
      let fromType = nodeFrom.data.objecttype;
      fromType = myMetis.findObjectType(fromType.id);
      const nodesTo  = modalContext.args.nodesTo;
      if (debug) console.log('1138 objFrom, objfromView: ', objFrom, objfromView);

      // Go through each link and identify its toNode
      let modifiedRelships = new Array();
      let modifiedRelshipViews = new Array();
      for (let i=0; i<links.length; i++) {
        let link = links[i];
        // link = myDiagram.findLinkForKey(link.key);
        const nodeTo = myDiagram.findNodeForKey(link.to);
        let objtoView = nodeTo.data.objectview;
        objtoView = myMetis.findObjectView(objtoView.id);
        // Create the corresponding relship and relship view
        let objTo = nodeTo.data.object;
        objTo = myMetis.findObject(objTo.id);
        let toType = nodeTo.data.objecttype;
        toType = myMetis.findObjectType(toType.id);
        const reltype = myMetis.findRelationshipTypeByName2(typename, fromType, toType);
        if (reltype) {
          const rel = new akm.cxRelationship(utils.createGuid(), reltype, objFrom, objTo, typename, "");
          myModel.addRelationship(rel); 
          myMetis.addRelationship(rel); 
          const relview = new akm.cxRelationshipView(utils.createGuid(), rel.name, rel, "");
          if (debug) console.log('1152 rel, relview', rel, relview);
          relview.fromObjview = objfromView;
          relview.toObjview = objtoView;
          rel.addRelationshipView(relview);
          myModelview.addRelationshipView(relview); 
          if (debug) console.log('1162 myModelview, relview', myModelview, relview);
          myMetis.addRelationshipView(relview); 
          const jsnRelship = new jsn.jsnRelationship(rel);
          modifiedRelships.push(jsnRelship);
          const jsnRelview = new jsn.jsnRelshipView(relview);
          modifiedRelshipViews.push(jsnRelview);
        }
      }
      modifiedRelships.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
      })
      modifiedRelshipViews.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      })
    }
    break;
  }
}
