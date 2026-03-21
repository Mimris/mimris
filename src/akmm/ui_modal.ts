// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;

import { RegexParser } from 'regex-parser';
// import { filter } from 'cheerio/lib/api/traversing';

import * as akm from '../akmm/metamodeller';
import * as jsn from './ui_json';
import * as uic from './ui_common';
import * as uid from './ui_diagram';
import * as uit from './ui_templates';
import * as gjs from './ui_gojs';
import * as constants from './constants';
// const RegexParser = require("regex-parser");
// const utils = require('./utilities');
import * as utils from './utilities';

// Safe stringifier that avoids circular reference errors and strips functions
function safeClone<T>(obj: T): T {
  try {
    // Use structuredClone if available (Node 17+, browsers) for deep cloning
    // @ts-ignore
    if (typeof structuredClone === 'function') {
      // structuredClone will still fail on some complex objects, so guard in try/catch
      try {
        return structuredClone(obj);
      } catch (_e) {
        // fallback to replacer below
      }
    }
  } catch (_) {
    // ignore
  }

  const seen = new WeakSet<any>();
  function replacer(_key: string, value: any) {
    if (typeof value === 'function') return undefined;
    if (value && typeof value === 'object') {
      if (seen.has(value)) return undefined;
      seen.add(value);
    }
    return value;
  }

  try {
    const text = JSON.stringify(obj, replacer);
    return JSON.parse(text) as T;
  } catch (e) {
    // Last resort: shallow copy enumerable properties
    if (obj && typeof obj === 'object') {
      const out: any = {};
      for (const k in obj as any) {
        const v = (obj as any)[k];
        if (typeof v === 'function') continue;
        if (v && typeof v === 'object') continue; // avoid nested circulars
        out[k] = v;
      }
      return out as T;
    }
    return obj;
  }
}


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
    myInst = myMetis.findObject(instview?.objectRef);
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
  if (obj.category === constants.gojs.C_OBJECTVIEW) {
    const objview = myMetis.findObjectView(obj?.id || obj?.key);
    if (objview) {
      myItem = objview;
      const myDiagram = context?.myDiagram || myMetis?.myDiagram;
      let startedTxn = false;
      try {
        if (myDiagram?.startTransaction) {
          myDiagram.startTransaction('edit-objectview-live');
          startedTxn = true;
        }
      } catch {
        // Do nothing
      }
      try {
        myItem[propname] = value;
      } catch {
        // Do nothing
      }
      const goNode =
        myMetis.gojsModel?.findNode?.(objview.id) ||
        myMetis.gojsModel?.findNode?.(objview.key) ||
        myMetis.currentNode;
      try {
        if (goNode) {
          goNode[propname] = value;
          if (goNode.data) {
            if (myDiagram?.model?.setDataProperty) {
              myDiagram.model.setDataProperty(goNode.data, propname, value);
            } else {
              goNode.data[propname] = value;
            }
          }
          try { goNode.updateTargetBindings?.(); } catch {}
        }
      } catch {
        // Do nothing
      }
      try {
        myDiagram?.updateAllTargetBindings?.(propname);
        myDiagram?.requestUpdate?.();
      } catch {
        // Do nothing
      }
      try {
        const data = safeClone(new jsn.jsnObjectView(objview));
        myDiagram?.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
      } catch {
        // Do nothing
      }
      try {
        if (startedTxn) {
          myDiagram?.commitTransaction?.('edit-objectview-live');
        }
      } catch {
        // Do nothing
      }
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
      const objtype = myMetamodel.findObjectTypeByName(typename);
      myDiagram.selection.each(function(sel) {
        const gjsInst = sel.data;
        if (gjsInst.category === constants.gojs.C_OBJECT) {
          const goNode: gjs.goObjectNode = myGoModel.findNodeByViewId(gjsInst.key);
          let object: akm.cxObject = goNode?.object;
          uic.setObjectType(gjsInst, objtype, context, false);
          const n = myDiagram.findNodeForKey(gjsInst.key);
          // myDiagram.model.setDataProperty(n.data, "typename", typename);
          if (objtype.name !== constants.types.AKM_ENTITY_TYPE)
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
          if (!objview) objview = myMetis.findObjectView(inst.objviewRef);
          const icn = myDiagram.findNodeForKey(inst.key);
          const idata = icn.data;
          myDiagram.model.setDataProperty(idata, "icon", icon);
          myDiagram.requestUpdate();
          
          // Force the binding to update by clearing the old source
          const pictureElement = icn?.findObject("Picture");
          if (pictureElement) {
            // Manually call the converter to update the source
            const source = uit.getIconSource(icon);
            pictureElement.source = source;
          }
          
          if (objview) {
            objview = myMetis.findObjectView(objview.id);
            objview.icon = icon;
            console.log("Setting objview.icon to:", icon);
            const jsnObjview = new jsn.jsnObjectView(objview);
            console.log("jsnObjview.icon:", jsnObjview.icon);
            const modifiedObjviews = [];
            modifiedObjviews.push(jsnObjview);
            modifiedObjviews.map(mn => {
              // Make sure to include the icon field in the data
              const data = safeClone(mn);
              console.log("Dispatching UPDATE_OBJECTVIEW_PROPERTIES with data:", data);
              console.log("Data icon field:", data.icon);
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
              const data = safeClone(mn);
              myDiagram.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
            });
          }
          myDiagram.requestUpdate();
        }
      });
      break;
    }
    case "Set Group Image": {
      const image = (selectedOption) && selectedOption;
      const group = modalContext.currentGroup;
      if (!group) break;
      
      const groupPart = myDiagram.findPartForKey(group.key);
      if (groupPart) {
        myDiagram.model.setDataProperty(group, "image", image);
        myDiagram.requestUpdate();
      }
      
      // Update the objectview if it exists
      let objview = group.objectview;
      if (!objview && group.objviewRef) {
        objview = myMetis.findObjectView(group.objviewRef);
      }
      if (objview) {
        objview = myMetis.findObjectView(objview.id);
        objview.image = image;
        const jsnObjview = new jsn.jsnObjectView(objview);
        const modifiedObjviews = [];
        modifiedObjviews.push(jsnObjview);
        modifiedObjviews.map(mn => {
          const data = safeClone(mn);
          myMetis.myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
        });
      }
      
      if (groupPart) groupPart.isSelected = false;
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
          const data = safeClone(mn);
          myMetis.myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
        });
      } else
      if (!metamodelling) {
        myModelview.layout = layout;
        const modifiedModelviews = new Array();
        const jsnModelview = new jsn.jsnModelView(myModelview);
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
          const data = safeClone(mn);
          myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        })
      } else {
        myMetamodel.layout = layout;
        const modifiedMetamodels = new Array();
        const jsnMetamodel = new jsn.jsnMetaModel(myMetamodel, true);
        modifiedMetamodels.push(jsnMetamodel);
        modifiedMetamodels.map(mn => {
          const data = safeClone(mn);
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
          const data = safeClone(mn);
          myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        })
      } else {
        myMetamodel.routing = routing;
        const modifiedMetamodels = new Array();
        const jsnMetamodel = new jsn.jsnMetaModel(myMetamodel, true);
        modifiedMetamodels.push(jsnMetamodel);
        modifiedMetamodels.map(mn => {
          const data = safeClone(mn);
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
          const data = safeClone(mn);
          myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        })
      } else {
        myMetamodel.linkcurve = linkcurve;
        const modifiedMetamodels = new Array();
        const jsnMetamodel = new jsn.jsnMetaModel(myMetamodel, true);
        modifiedMetamodels.push(jsnMetamodel);
        modifiedMetamodels.map(mn => {
          const data = safeClone(mn);
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
    case "Select All Relationships of This Type": {
      const typename = (selectedOption) && selectedOption;
      if (!typename) break;
      const types = myMetamodel.findRelationshipTypesByName(typename) || [];
      if (!types || types.length === 0) break;
      const reltype = types[0];
      const links = myDiagram.links;
      for (let it = links.iterator; it?.next();) {
        const link = it.value;
        try {
          if (link.data && link.data.relshiptype && link.data.relshiptype.id === reltype.id) {
            link.isSelected = true;
          }
        } catch (_) {}
      }
      break;
    }
    case "Hide Views of Relationship Type": {
      const typename = (selectedOption) && selectedOption;
      if (!typename) break;
      const types = myMetamodel.findRelationshipTypesByName(typename) || [];
      if (!types || types.length === 0) break;
      const reltype = types[0];
      const modelview = myMetis.currentModelview;
      if (!modelview) break;
      const relviews = modelview.relshipviews || [];
      const modifiedRelshipViews: any[] = [];
      const linksHided: any[] = [];
      for (let i = 0; i < relviews.length; i++) {
        const relview = relviews[i];
        if (!relview) continue;
        if (relview.relshiptype && relview.relshiptype.id === reltype.id) {
          relview.visible = false;
          const jsnRelView = new jsn.jsnRelshipView(relview);
          modifiedRelshipViews.push(jsnRelView);
          const goLink = myMetis.gojsModel.findLinkByViewId(relview.id);
          const link = myDiagram.findLinkForKey(goLink?.key);
          if (link) {
            link.visible = false;
            linksHided.push(link);
          }
        }
      }
      for (let i = 0; i < linksHided.length; i++) {
        const link = linksHided[i];
        try { myDiagram.remove(link); } catch (_) {}
      }
      modifiedRelshipViews.map(mn => {
        const data = safeClone(mn);
        myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
      });
      break;
    }
    case "Delete Views of Relationship Type": {
      const typename = (selectedOption) && selectedOption;
      if (!typename) break;
      const types = myMetamodel.findRelationshipTypesByName(typename) || [];
      if (!types || types.length === 0) break;
      const reltype = types[0];
      const modelview = myMetis.currentModelview;
      if (!modelview) break;
      const relviews = modelview.relshipviews || [];
      const modifiedRelshipViews: any[] = [];
      for (let i = 0; i < relviews.length; i++) {
        const relview = relviews[i];
        if (!relview) continue;
        if (relview.relshiptype && relview.relshiptype.id === reltype.id) {
          // mark as deleted
          relview.markedAsDeleted = true;
          const jsnRelView = new jsn.jsnRelshipView(relview);
          modifiedRelshipViews.push(jsnRelView);
        }
      }
      modifiedRelshipViews.map(mn => {
        const data = safeClone(mn);
        myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
      });
      break;
    }
    case "Delete Relationships of This Type": {
      const typename = (selectedOption) && selectedOption;
      if (!typename) break;
      const types = myMetamodel.findRelationshipTypesByName(typename) || [];
      if (!types || types.length === 0) break;
      const reltype = types[0];
      // Remove all links whose relshiptype matches
      const toRemove: any[] = [];
      const links = myDiagram.links;
      for (let it = links.iterator; it?.next();) {
        const link = it.value;
        try {
          if (link.data && link.data.relshiptype && link.data.relshiptype.id === reltype.id) {
            toRemove.push(link);
          }
        } catch (_) {}
      }
      if (toRemove.length > 0) {
        myDiagram.startTransaction('delete-relship-type');
        for (let i = 0; i < toRemove.length; i++) {
          try { myDiagram.model.removeLinkData(toRemove[i].data); } catch (_) {}
        }
        myDiagram.commitTransaction('delete-relship-type');
      }
      break;
    }
    case "Set Target Model": { 
      const modelName = (selectedOption) && selectedOption;
      const targetModel = myMetis.findModelByName(modelName);
      myMetis.currentTargetModel = targetModel
      myMetis.currentModel.targetModelRef = targetModel.id
  let mdata = new jsn.jsnModel(myMetis.currentModel, true);
  mdata = safeClone(mdata);
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
      myMetis.currentTargetMetamodel = targetMetamodel;
      myMetis.currentModel.targetMetamodelRef = targetMetamodel?.id
  let mmdata = new jsn.jsnModel(myMetis.currentModel, true);
  mmdata = safeClone(mmdata);
  myMetis.myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data: mmdata });
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
          if (!relship) relship = myMetis.findRelationship(relshipRef);
          const fromObject = relship.fromObject;
          const toObject   =  relship.toObject;
          let fromType = fromObject.type;;
          let toType   = toObject.type;
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
            default:
              if (reltype) myDiagram.model.setDataProperty(link, 'name', reltype.name);
              break;
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
              const data = safeClone(mn);
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
              const data = safeClone(mn);
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
            const data = safeClone(mn);
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

  const applyObjectviewUpdateById = (root: any, data: any) => {
    if (!root?.metis?.models || !data?.id) return;
    for (let mi = 0; mi < root.metis.models.length; mi++) {
      const model = root.metis.models[mi];
      const modelviews = model?.modelviews || [];
      for (let mvi = 0; mvi < modelviews.length; mvi++) {
        const modelview = modelviews[mvi];
        const objectviews = modelview?.objectviews || [];
        for (let ovi = 0; ovi < objectviews.length; ovi++) {
          const objectview = objectviews[ovi];
          if (objectview?.id === data.id) {
            Object.assign(objectview, data);
            return;
          }
        }
      }
    }
  }

  const dispatchUpdate = (action: any) => {
    try { myDiagram?.dispatch?.(action); } catch (_) {}
    try { myMetis?.myDiagram?.dispatch?.(action); } catch (_) {}
    try { myMetis?.dispatch?.(action); } catch (_) {}
    try { props?.dispatch?.(action); } catch (_) {}
    if (action?.type === 'UPDATE_OBJECTVIEW_PROPERTIES' && action?.data?.id) {
      try { applyObjectviewUpdateById(props?.phData, action.data); } catch (_) {}
      try {
        const rawSession = window?.sessionStorage?.getItem('memorystate');
        if (rawSession) {
          const parsedSession = JSON.parse(rawSession);
          applyObjectviewUpdateById(parsedSession?.phData, action.data);
          window?.sessionStorage?.setItem('memorystate', JSON.stringify(parsedSession));
        }
      } catch (_) {}
      try {
        const rawLocal = window?.localStorage?.getItem('memorystate');
        if (rawLocal) {
          const parsedLocal = JSON.parse(rawLocal);
          applyObjectviewUpdateById(parsedLocal?.phData, action.data);
          window?.localStorage?.setItem('memorystate', JSON.stringify(parsedLocal));
        }
      } catch (_) {}
    }
  }

  const pushPhDataUpdate = (data: any) => {
    if (!props?.phData?.metis || !data?.id) return;
    try {
      const phDataClone = JSON.parse(JSON.stringify(props.phData));
      applyObjectviewUpdateById(phDataClone, data);
      props?.dispatch?.({ type: 'LOAD_TOSTORE_PHDATA', data: phDataClone });
    } catch (_) {}
  }

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
        const data = safeClone(mn);
        dispatchUpdate({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
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
        const data = safeClone(mn);
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
        let dataObj = safeClone(jsnObj);
        myMetis.myDiagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: dataObj })
      }
      const jsnObjview = new jsn.jsnObjectView(objview);
      let dataObjView = safeClone(jsnObjview);
      myMetis.myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: dataObjView })
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
        try {
        myDiagram.model.setDataProperty(gjsData, k, relship[k]);
        } catch (e) {}
      }
      // if (relship.relshipkind !== constants.relkinds.REL) {
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
      // }
      if (myModelview.showCardinality) {
        myDiagram.model.setDataProperty(gjsData, 'cardinalityFrom', relship.getCardinalityFrom());
        myDiagram.model.setDataProperty(gjsData, 'cardinalityTo', relship.getCardinalityTo());
      } else {
        myDiagram.model.setDataProperty(gjsData, 'cardinalityFrom', '');
        myDiagram.model.setDataProperty(gjsData, 'cardinalityTo', '');
      }
      // Dispatch
  const jsnRelship = new jsn.jsnRelationship(relship);
  let dataRel = safeClone(jsnRelship);
  dispatchUpdate({ type: 'UPDATE_RELSHIP_PROPERTIES', data: dataRel })
  const jsnRelview = new jsn.jsnRelshipView(relview);
  let dataRelView = safeClone(jsnRelview);
  dispatchUpdate({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data: dataRelView })
      break;
    }
    case "editObjectview": {
      // selObj is a node representing an object or an objectview
      const selObj = selectedData;
      const goNode = myGoModel.findNodeByViewId(selObj.key);
      const objview =
        myModelview.findObjectView(selObj.key) ||
        goNode?.objectview ||
        goNode?.data?.objectview;
      if (!objview || !goNode) {
        if (debug) console.log("editObjectview: missing goNode or objview", selObj);
        break;
      }
      let startedTxn = false;
      try {
        if (myDiagram?.startTransaction) {
          myDiagram.startTransaction('edit-objectview-close');
          startedTxn = true;
        }
      } catch {
        // Do nothing
      }
      const keepValue = (nextValue: any, ...fallbacks: any[]) => {
        if (nextValue !== undefined && nextValue !== null && nextValue !== "") return nextValue;
        for (let i = 0; i < fallbacks.length; i++) {
          const candidate = fallbacks[i];
          if (candidate !== undefined && candidate !== null && candidate !== "") return candidate;
        }
        return nextValue;
      };
      objview.viewkind = selObj.viewkind;
      objview.template = selObj.template;
      objview.template2 = selObj.template2;
      objview.icon = selObj.icon;
      objview.figure = selObj.figure;
      objview.figure2 = selObj.figure2;
      objview.fillcolor = keepValue(selObj.fillcolor, objview.fillcolor, goNode?.fillcolor, goNode?.data?.fillcolor);
      objview.fillcolor2 = keepValue(selObj.fillcolor2, objview.fillcolor2, goNode?.fillcolor2, goNode?.data?.fillcolor2);
      objview.strokecolor = keepValue(selObj.strokecolor, objview.strokecolor, goNode?.strokecolor, goNode?.data?.strokecolor);
      objview.strokecolor2 = keepValue(selObj.strokecolor2, objview.strokecolor2, goNode?.strokecolor2, goNode?.data?.strokecolor2);
      objview.strokewidth = keepValue(selObj.strokewidth, objview.strokewidth, goNode?.strokewidth, goNode?.data?.strokewidth);
      objview.textcolor = keepValue(selObj.textcolor, objview.textcolor, goNode?.textcolor, goNode?.data?.textcolor);
      objview.textcolor2 = keepValue(selObj.textcolor2, objview.textcolor2, goNode?.textcolor2, goNode?.data?.textcolor2);
      objview.textscale = keepValue(selObj.textscale, objview.textscale, goNode?.textscale, goNode?.data?.textscale);
      objview.groupLayout = selObj.groupLayout;
      goNode.viewkind = selObj.viewkind;
      goNode.template = selObj.template;
      goNode.template2 = selObj.template2;
      goNode.icon = selObj.icon;
      goNode.figure = selObj.figure;
      goNode.figure2 = selObj.figure2;
      goNode.fillcolor = keepValue(selObj.fillcolor, goNode.fillcolor, objview.fillcolor, goNode?.data?.fillcolor);
      goNode.fillcolor2 = keepValue(selObj.fillcolor2, goNode.fillcolor2, objview.fillcolor2, goNode?.data?.fillcolor2);
      goNode.strokecolor = keepValue(selObj.strokecolor, goNode.strokecolor, objview.strokecolor, goNode?.data?.strokecolor);
      goNode.strokecolor2 = keepValue(selObj.strokecolor2, goNode.strokecolor2, objview.strokecolor2, goNode?.data?.strokecolor2);
      goNode.strokewidth = keepValue(selObj.strokewidth, goNode.strokewidth, objview.strokewidth, goNode?.data?.strokewidth);
      goNode.textcolor = keepValue(selObj.textcolor, goNode.textcolor, objview.textcolor, goNode?.data?.textcolor);
      goNode.textcolor2 = keepValue(selObj.textcolor2, goNode.textcolor2, objview.textcolor2, goNode?.data?.textcolor2);
      goNode.textscale = keepValue(selObj.textscale, goNode.textscale, objview.textscale, goNode?.data?.textscale);
      goNode.groupLayout = selObj.groupLayout;
      uid.updateNodeAndView(selObj, goNode, objview, myDiagram);
      const diagramNode = myDiagram.findNodeForKey(selObj.key || objview.id || goNode.key);
      const diagramData = diagramNode?.data || goNode?.data;
      if (diagramData && myDiagram?.model?.setDataProperty) {
        try { myDiagram.model.setDataProperty(diagramData, 'objectview', objview); } catch {}
        try { diagramData.objectview = objview; } catch {}
        myDiagram.model.setDataProperty(diagramData, 'fillcolor', objview.fillcolor);
        myDiagram.model.setDataProperty(diagramData, 'fillcolor2', objview.fillcolor2);
        myDiagram.model.setDataProperty(diagramData, 'strokecolor', objview.strokecolor);
        myDiagram.model.setDataProperty(diagramData, 'strokecolor2', objview.strokecolor2);
        myDiagram.model.setDataProperty(diagramData, 'strokewidth', objview.strokewidth);
        myDiagram.model.setDataProperty(diagramData, 'textcolor', objview.textcolor);
        myDiagram.model.setDataProperty(diagramData, 'textcolor2', objview.textcolor2);
        myDiagram.model.setDataProperty(diagramData, 'textscale', objview.textscale);
        try { uic.setObjviewAttributes(diagramData, myDiagram); } catch {}
      }
      const forceNodeVisuals = (part: any, view: any) => {
        if (!part || !view) return;
        const shapeNames = ['SHAPE', 'BODY', 'SELECTION_BOX', 'LANE_BODY_SHAPE'];
        for (let i = 0; i < shapeNames.length; i++) {
          const shape = part.findObject?.(shapeNames[i]);
          if (!shape) continue;
          try {
            if (view.fillcolor !== undefined) shape.fill = view.fillcolor || 'transparent';
          } catch {}
          try {
            if (view.strokecolor !== undefined && shape.stroke !== undefined) shape.stroke = view.strokecolor || shape.stroke;
          } catch {}
          try {
            if (view.strokewidth !== undefined && shape.strokeWidth !== undefined) shape.strokeWidth = Number(view.strokewidth) || shape.strokeWidth;
          } catch {}
        }
      };
      forceNodeVisuals(diagramNode, objview);
      try { diagramNode?.updateTargetBindings?.(); } catch {}
      try { myDiagram?.updateAllTargetBindings?.('fillcolor'); } catch {}
      try { myDiagram?.requestUpdate?.(); } catch {}
      myModelview.addObjectView(objview);
      const persistedObjview = myModelview.findObjectView(objview.id);
      if (persistedObjview) {
        persistedObjview.fillcolor = objview.fillcolor;
        persistedObjview.fillcolor2 = objview.fillcolor2;
        persistedObjview.strokecolor = objview.strokecolor;
        persistedObjview.strokecolor2 = objview.strokecolor2;
        persistedObjview.strokewidth = objview.strokewidth;
        persistedObjview.textcolor = objview.textcolor;
        persistedObjview.textcolor2 = objview.textcolor2;
        persistedObjview.textscale = objview.textscale;
      }
      if (debug) console.log("editObjectview: ", selObj);

      // Do dispatch
      const jsnObjview = new jsn.jsnObjectView(objview);
  let data = safeClone(jsnObjview);
  console.warn('[OBJVIEW_SAVE]', { id: data?.id, fillcolor: data?.fillcolor, fillcolor2: data?.fillcolor2, strokecolor: data?.strokecolor, name: data?.name });
  dispatchUpdate({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
  pushPhDataUpdate(data)
      try {
        props?.dispatch?.({
          type: 'SET_FOCUS_REFRESH',
          data: { id: Math.random().toString(36).substring(7), name: 'editObjectview' }
        });
      } catch (_) {}
      try {
        if (startedTxn) {
          myDiagram?.commitTransaction?.('edit-objectview-close');
        }
      } catch {
        // Do nothing
      }
      const modifiedModelviews = new Array();
      
      // const jsnModelview = new jsn.jsnModelView(myModelview);
      // modifiedModelviews.push(jsnModelview);
      // modifiedModelviews.map(mn => {
      //   let data = mn;
      //   data = JSON.parse(JSON.stringify(data));
      //  myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
      // })
    return;
    }

    case "selectDropdown": {
      if (modalContext.title === 'Select Icon') {
        if (selectedData.category === constants.gojs.C_OBJECT) {
          const selObj = selectedData;
          const node = myDiagram.findNodeForKey(selObj.key);
          const data = node.data;
          let objview = data.objectview;
          if (!objview) {
            objview = myModelview.findObjectView(selObj.key);
            data.objectview = objview;
          }
          if (objview) {
            objview.icon = data.icon;
            const jsnObjview = new jsn.jsnObjectView(data.objectview);
            const modifiedObjviews = new Array();    
            modifiedObjviews.push(jsnObjview);
            modifiedObjviews.map(mn => {
              const data = safeClone(mn);
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
            const data = safeClone(mn);
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
              const data = safeClone(mn);
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
        let selectedValue;
        try {
          selectedValue = selectedData[0];
        } catch {
          selectedValue = selectedData;
        }
        const objview = myMetis.currentModelview.findObjectViewByName(selectedValue);
        context.myCurrentObjectview = objview;
        let metamodel = myMetis.findMetamodelByName(selectedValue); 
        if (!metamodel) {
          metamodel = new akm.cxMetaModel(utils.createGuid(), selectedValue, "");
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
        let objId = node.objRef;
        let object = myMetis.findObject(objId);
        // if (object)
        //   objId = object.id;
        // else
        //   objId = node.objRef;
        // object = myMetis.findObject(objId);
        let objview = node.objectview;
        let objviewId;
        if (objview)
          objviewId = objview.id;
        else
          objviewId = node.objviewRef;
        objview = myMetis.findObjectView(objviewId);
        const side = selectedValue;
        let name = '';
        switch(side) {
          case 'top':
          case 'Control':
            name = 'C';
            break;
          case 'bottom':
          case 'Mechanism':
            name = 'M';
            break;
          case 'left':
          case 'Input':
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
            const data = safeClone(mn);
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
        const relshipRef = link.data.relshipRef;
        let relship = myModel.findRelationship(relshipRef);
        if (!relship)
          relship = myMetis.findRelationshipType(relshipRef);
        const fromReltype = relship.type;
        if ( relship.name === fromReltype.name) {
          relship.name = reltype.name;
          // link.name = reltype.name;
          myDiagram.model.setDataProperty(link.data, 'name', relship.name);
        }
        relship.type = reltype;
        // Do the dispatches
        const modifiedRelships = new Array();
        const jsnRel = new jsn.jsnRelationship(relship);
        modifiedRelships.push(jsnRel);
        modifiedRelships?.map(mn => {
          const data = safeClone(mn);
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
      goLink.template2 = selRel.template2;
      relview.template2 = selRel.template2;
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
          if (prop === 'template2' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'strokecolor' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'strokewidth' && relview[prop])
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
            if (prop === 'textcolor' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'textscale' && relview[prop]) 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'dash' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'routing' && relview[prop]) 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'curve' && relview[prop]) 
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
        if (!objtypeview) {
          let objtypeRef = selObj.objtypeRef;
          const objtype = myMetamodel.findObjectType(objtypeRef);
          objtypeview = objtype.typeview;
        }
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
        if (objtypeview) {
          myMetis.addObjectTypeView(objtypeview);
          const jsnObjtypeview = new jsn.jsnObjectTypeView(objtypeview);
          modifiedObjTypeviews.push(jsnObjtypeview);
          modifiedObjTypeviews.map(mn => {
            const data = safeClone(mn);
            myDiagram.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
          })
        }
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
                if (typeview[prop] === 'None') scale = 1.0;
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
            const data = safeClone(mn);
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
                  const data = safeClone(mn);
                  myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
                })
          }
        }
        relview = uic.updateRelationshipView(relview);
        const jsnRelview = new jsn.jsnRelshipView(relview);
        modifiedRelviews.push(jsnRelview);
        modifiedRelviews.map(mn => {
          const data = safeClone(mn);
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
      let fromObjview = myModelview.findObjectView(fromKey);
      if (!fromObjview)
        fromObjview = myMetis.findObjectView(fromKey);     
      let fromObj = fromObjview.object;
      if (!fromObj) fromObj = myMetis.findObject(fromObjview.objectRef);
      let fromType = fromObj.type;
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
          if (!toObj) continue;
          const toType = toObj.type;
          // Get the selected relship type
          const relTypename = (selectedOption) && selectedOption; // Get the selected relship typename
          let reltype: akm.cxRelationshipType;
          if (relTypename === constants.types.AKM_CONTAINS)
            reltype = myMetis.findRelationshipTypeByName(constants.types.AKM_CONTAINS);
          else
            reltype = myMetis.findRelationshipTypeByName2(relTypename, fromType, toType);
          if (!reltype) continue;
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
