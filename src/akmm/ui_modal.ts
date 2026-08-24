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
import { getCurrentStore } from '../store';
import { MEMORY_STATE_STORAGE_KEY, persistMemoryState } from '../components/utils/memoryStateStorage';
import { dispatchUniversePhData } from '../sharedUniverse';
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

/**
 * Remove objectview attributes that match typeview defaults (delta-only storage).
 * @param objviewData - The objectview data to be saved
 * @param typeview - The typeview containing default values
 * @returns Filtered objviewData with only overridden attributes
 */
function applyDeltaStorage(objviewData: any, typeview: any): any {
  if (!objviewData || !typeview) return objviewData;
  
  const visualAttributes = [
    'fillcolor', 'fillcolor2', 'strokecolor', 'strokecolor2', 
    'strokewidth', 'textcolor', 'textcolor2', 'textscale',
    'memberscale', 'arrowscale', 'icon', 'icon1', 'icon2', 'icon3',
    'image', 'figure', 'figure2', 'geometry', 'template', 'template2',
    'groupLayout'
  ];
  
  const result = { ...objviewData };
  
  for (const attr of visualAttributes) {
    const objviewValue = result[attr];
    const typeviewValue = typeview[attr];
    
    // If objectview value matches typeview default, remove it (store only delta)
    if (objviewValue === typeviewValue) {
      delete result[attr];
    } else if ((objviewValue === '' || objviewValue === null || objviewValue === undefined) &&
               (typeviewValue !== undefined && typeviewValue !== null && typeviewValue !== '')) {
      // If objectview has no value but typeview has one, remove it (will be inherited)
      delete result[attr];
    }
  }
  
  return result;
}

function isPersistableRelshipviewProp(prop: string, value: any): boolean {
  if (!prop || prop === 'class') return false;
  if (typeof value === 'function') return false;
  if (value && typeof value === 'object') return false;
  if (
    prop === 'id' ||
    prop === 'key' ||
    prop === 'data' ||
    prop === 'relship' ||
    prop === 'relshipview' ||
    prop === 'relshipRef' ||
    prop === 'typeview' ||
    prop === 'typeviewRef' ||
    prop === 'fromObjview' ||
    prop === 'toObjview' ||
    prop === 'fromobjviewRef' ||
    prop === 'toobjviewRef' ||
    prop === 'fromPortid' ||
    prop === 'toPortid' ||
    prop === 'points'
  ) return false;
  return true;
}

function normalizeRelshipviewEditableValue(prop: string, value: any): any {
  if ((prop === 'fromArrow' || prop === 'toArrow') && value === 'None') return '';
  if (
    (prop === 'textscale' || prop === 'arrowscale' || prop === 'strokewidth' || prop === 'corner') &&
    value !== undefined &&
    value !== null &&
    value !== ''
  ) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : value;
  }
  return value;
}


export function handleInputChange(myMetis: akm.cxMetis, props: any, value: string) {
  console.log('[UI-MODAL] ==================== handleInputChange CALLED ====================');
  console.log('[UI-MODAL] props.id (propname):', props.id, 'value:', value);
  console.log('[UI-MODAL] props.obj.category:', props.obj?.category);
  console.log('[UI-MODAL] props.obj.key:', props.obj?.key);
  console.log('[UI-MODAL] props.obj.id:', props.obj?.id);
  console.log('[UI-MODAL] props.context.what:', props.context?.what);
  console.log('[UI-MODAL] Is this a strokecolor change for non-relationship?', props.id === 'strokecolor' && props.obj?.category !== 'Relationship');
  
  const propname = props.id;
  const fieldType = props.type;
  const obj = props.obj;

  const context = props.context;
  const pattern = props.pattern;
  const persistRelshipviewEdit = (data: any) => {
    if (!data?.id) return;
    try {
      const store = getCurrentStore();
      const state = store?.getState?.();
      const currentPhData = state?.phData;
      if (!currentPhData?.metis) return;
      const phDataClone = JSON.parse(JSON.stringify(currentPhData));
      const models = phDataClone?.metis?.models || [];
      for (let mi = 0; mi < models.length; mi++) {
        const modelviews = models[mi]?.modelviews || [];
        for (let mvi = 0; mvi < modelviews.length; mvi++) {
          const relshipviews = modelviews[mvi]?.relshipviews || [];
          for (let rvi = 0; rvi < relshipviews.length; rvi++) {
            if (relshipviews[rvi]?.id === data.id) {
              Object.assign(relshipviews[rvi], data);
            }
          }
        }
      }
      const snapshot = {
        phData: phDataClone,
        phFocus: state?.phFocus,
        phUser: state?.phUser,
        phSource: state?.phSource,
      };
      persistMemoryState(snapshot);
    } catch (_) {
      // Do nothing
    }
  };
  // const myDiagram = context.myDiagram;
  let inst, instview, typeview, myInst, myInstview, myTypeview, myItem;
  const coerceNumericObjectviewValue = (name: string, rawValue: any) => {
    if (name !== 'memberscale' && name !== 'arrowscale' && name !== 'textscale') {
      return rawValue;
    }
    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      return rawValue;
    }
    const numericValue = Number(rawValue);
    return Number.isFinite(numericValue) ? numericValue : rawValue;
  };
  const nextObjectviewValue = coerceNumericObjectviewValue(propname, value);
  const swimlaneCategory = String(obj?.template || obj?.category || '');
  const isSwimlaneRename =
    propname === 'name' &&
    (swimlaneCategory === 'Pool' || swimlaneCategory === 'Lane' || swimlaneCategory === 'Lane_w_handles');
  if (isSwimlaneRename) {
    const myDiagram = context?.myDiagram || myMetis?.myDiagram;
    const identityAliases = new Set(
      [obj?.key, obj?.id, obj?.objviewRef, obj?.objectview?.id, obj?.data?.key, obj?.data?.objviewRef]
        .filter((id) => id !== undefined && id !== null && id !== '')
        .map((id) => String(id))
    );
    let part = myDiagram?.findPartForKey?.(obj?.key) || myDiagram?.findNodeForKey?.(obj?.key);
    if (!part && identityAliases.size > 0) {
      try {
        myDiagram?.nodes?.each?.((candidate: any) => {
          if (part) return;
          const candidateData = candidate?.data || {};
          const candidateIds = [candidateData.key, candidateData.id, candidateData.objviewRef, candidateData.objectview?.id]
            .filter((id) => id !== undefined && id !== null && id !== '')
            .map((id) => String(id));
          if (candidateIds.some((id) => identityAliases.has(id))) part = candidate;
        });
      } catch (_) {
        // Leave the selected data as a fallback below.
      }
    }
    const data = part?.data || obj?.data || obj;
    const objectview =
      myMetis?.findObjectView?.(data?.key || obj?.key) ||
      data?.objectview ||
      obj?.objectview;
    const object = objectview?.object || data?.object || obj?.object;
    const applyLiveName = () => {
      try { myDiagram?.model?.setDataProperty?.(data, 'name', value); } catch (_) { data.name = value; }
      try { if (data?.objectview) myDiagram?.model?.setDataProperty?.(data, 'objectview', data.objectview); } catch (_) {}
    };
    try {
      if (myDiagram?.isInTransaction) applyLiveName();
      else if (myDiagram?.commit) myDiagram.commit(applyLiveName, 'rename swimlane');
      else applyLiveName();
    } catch (_) {
      applyLiveName();
    }
    try { obj.name = value; } catch (_) {}
    try { if (objectview) objectview.name = value; } catch (_) {}
    try { if (object) object.name = value; } catch (_) {}
    try { myDiagram?.updateAllTargetBindings?.('name'); myDiagram?.requestUpdate?.(); } catch (_) {}
    try {
      if (objectview) {
        const data = safeClone(new jsn.jsnObjectView(objectview));
        myDiagram?.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
      }
      if (object) {
        const data = safeClone(new jsn.jsnObject(object));
        myDiagram?.dispatch?.({ type: 'UPDATE_OBJECT_PROPERTIES', data });
      }
    } catch (_) {
      // Do nothing
    }
    return;
  }
  // Handle object types
  if (obj.category === constants.gojs.C_OBJECTTYPE) {
    const node = obj; 
    inst = node.objecttype;
    typeview = node.typeview;

    if (context?.what === "editType" || context?.what === "editObjectType") {
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
    instview =
      context?.myContext?.objectview ||
      context?.objectview ||
      myMetis.findObjectView(node?.key) ||
      myMetis.findObjectView(node?.objviewRef) ||
      node?.objectview ||
      node?.data?.objectview;
    myInst = myMetis.findObject(instview?.objectRef);
    if (!myInst) myInst = obj;
    myInstview = instview //myMetis.findObjectView(instview?.id);
    typeview = myInst?.type?.typeview;
    if (context?.what === "editObjectview") {
        if (myInstview) {
          myItem = myInstview;
        }
    } else if (context?.what === "editTypeview") {
        myItem = myInst.type?.typeview; 
    } else {
        myItem = myInst;
    }
    try {
      myItem[propname] = propname === 'grabIsAllowed'
        ? (value === true || value === 'true')
        : nextObjectviewValue;
    } catch {
      // Do nothing
    }
    
    // CRITICAL: Mark this property as explicitly touched by the user
    // so handleCloseModal knows to persist the change to Redux/localStorage
    if (context?.what === "editObjectview") {
        // Store in myMetis since context/obj are frozen
        if (!myMetis.__editTracking) myMetis.__editTracking = {};
        const objKey = obj?.key || obj?.id;
        if (objKey) {
            if (!myMetis.__editTracking[objKey]) myMetis.__editTracking[objKey] = {};
            myMetis.__editTracking[objKey][propname] = true;
            console.log('[UI-MODAL] Marked objectview property as touched:', propname, 'for key:', objKey);
        }
    }
    
    if (context?.what === "editObjectview" && myInstview) {
      const myDiagram = context?.myDiagram || myMetis?.myDiagram;
      const targetObjviewId =
        myInstview?.id ||
        context?.myContext?.objectview?.id ||
        node?.objviewRef ||
        node?.key;
      const liveNode =
        myMetis?.currentNode ||
        myMetis?.gojsModel?.findNodeByViewId?.(node?.key) ||
        myMetis?.gojsModel?.findNode?.(node?.key) ||
        myDiagram?.findNodeForKey?.(node?.key) ||
        node;
      const nextValue = propname === 'grabIsAllowed'
        ? (value === true || value === 'true')
        : nextObjectviewValue;
      try {
        node[propname] = nextValue;
        liveNode[propname] = nextValue;
      } catch {
        // Do nothing
      }
      try {
        if (node?.objectview) node.objectview[propname] = nextValue;
        if (liveNode?.objectview) liveNode.objectview[propname] = nextValue;
        if (myInstview) myInstview[propname] = nextValue;
      } catch {
        // Do nothing
      }
      try {
        const liveData = liveNode?.data || node?.data;
        if (liveData) {
          if (liveData.objectview) {
            liveData.objectview[propname] = nextValue;
          }
          if (myDiagram?.model?.setDataProperty) {
            myDiagram.model.setDataProperty(liveData, propname, nextValue);
            if (liveData.objectview) {
              myDiagram.model.setDataProperty(liveData, 'objectview', liveData.objectview);
            }
          } else {
            liveData[propname] = nextValue;
          }
        }
      } catch {
        // Do nothing
      }
      try {
        const syncNode = (candidate: any) => {
          if (!candidate) return;
          const candidateData = candidate.data || candidate;
          const matches =
            candidate?.objviewRef === targetObjviewId ||
            candidateData?.objviewRef === targetObjviewId ||
            candidate?.key === targetObjviewId ||
            candidateData?.key === targetObjviewId ||
            candidate?.objectview?.id === targetObjviewId ||
            candidateData?.objectview?.id === targetObjviewId;
          if (!matches) return;
          try { candidate[propname] = nextValue; } catch {}
          try {
            if (candidate.objectview) candidate.objectview[propname] = nextValue;
          } catch {}
          try {
            if (candidateData.objectview) candidateData.objectview[propname] = nextValue;
          } catch {}
          try {
            if (myDiagram?.model?.setDataProperty && candidateData) {
              myDiagram.model.setDataProperty(candidateData, propname, nextValue);
              if (candidateData.objectview) {
                myDiagram.model.setDataProperty(candidateData, 'objectview', candidateData.objectview);
              }
            }
          } catch {}
        };
        try {
          myDiagram?.nodes?.each?.((part: any) => syncNode(part));
        } catch {}
        try {
          const goNodes = myMetis?.gojsModel?.nodes || [];
          for (let i = 0; i < goNodes.length; i++) syncNode(goNodes[i]);
        } catch {}
      } catch {
        // Do nothing
      }
      try { liveNode.updateTargetBindings?.(); } catch {}
      try {
        myDiagram?.updateAllTargetBindings?.(propname);
        myDiagram?.requestUpdate?.();
      } catch {
        // Do nothing
      }
      try {
        let data = safeClone(new jsn.jsnObjectView(myInstview));
        if (propname === 'grabIsAllowed') {
          data.grabIsAllowed = nextValue === true || nextValue === 'true';
        }
        if (propname === 'memberscale' || propname === 'arrowscale' || propname === 'textscale') {
          data[propname] = nextValue;
        }
        // Apply delta-only storage: remove attributes that match typeview defaults
        const typeview = myInstview?.typeview || myInst?.type?.typeview;
        if (typeview) {
          data = applyDeltaStorage(data, typeview);
        }
        myDiagram?.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
      } catch {
        // Do nothing
      }
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
        myItem[propname] = propname === 'grabIsAllowed'
          ? (value === true || value === 'true')
          : nextObjectviewValue;
      } catch {
        // Do nothing
      }
      const goNode =
        myMetis.gojsModel?.findNode?.(objview.id) ||
        myMetis.gojsModel?.findNode?.(objview.key) ||
        myMetis.currentNode;
      try {
        if (goNode) {
          goNode[propname] = nextObjectviewValue;
          if (goNode.data) {
            if (myDiagram?.model?.setDataProperty) {
              myDiagram.model.setDataProperty(goNode.data, propname, nextObjectviewValue);
            } else {
              goNode.data[propname] = nextObjectviewValue;
            }
          }
          if (propname === 'grabIsAllowed') {
            try {
              goNode.grabIsAllowed = value === true || value === 'true';
            } catch {}
            try {
              if (goNode.data) {
                const nextGrab = value === true || value === 'true';
                if (myDiagram?.model?.setDataProperty) {
                  myDiagram.model.setDataProperty(goNode.data, 'grabIsAllowed', nextGrab);
                } else {
                  goNode.data.grabIsAllowed = nextGrab;
                }
              }
            } catch {}
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
        let data = safeClone(new jsn.jsnObjectView(objview));
        if (propname === 'memberscale' || propname === 'arrowscale' || propname === 'textscale') {
          data[propname] = nextObjectviewValue;
        }
        // Apply delta-only storage: remove attributes that match typeview defaults
        const typeview = objview?.typeview || objview?.object?.type?.typeview;
        if (typeview) {
          data = applyDeltaStorage(data, typeview);
        }
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
    inst =
      link?.reltype ||
      link?.relshiptype ||
      myMetis.findRelationshipType(link?.reltypeRef || link?.relshiptype?.id);
    typeview =
      inst?.typeview ||
      link?.typeview ||
      myMetis.findRelationshipTypeView(link?.typeviewRef || inst?.typeview?.id);
    myTypeview = typeview;

    if (context?.what === "editType" || context?.what === "editRelationshipType") {
      myItem = inst;
    } else if (context?.what === "editTypeview") {
        myItem = typeview;
        myTypeview = myMetis.findRelationshipTypeView(typeview?.id) || typeview;
    } 
    try {
      if (myItem) myItem[propname] = value;
      if (context?.what === "editTypeview" && myTypeview) {
        myTypeview[propname] = value;
        // Also update the data object to keep it consistent
        if (myTypeview.data) {
          myTypeview.data[propname] = value;
        }
        
        // Sync the updated typeview back to myMetis so findRelationshipTypeView finds it
        myMetis.addRelationshipTypeView(myTypeview);
        
        // Also sync to metamodel if available
        const myMetamodel = context?.myContext?.metamodel || myMetis?.currentMetamodel;
        if (myMetamodel?.addRelationshipTypeView) {
          myMetamodel.addRelationshipTypeView(myTypeview);
        }
        
        // **FIX: Update the GoJS link data so visual changes are reflected immediately**
        const myDiagram = context?.myDiagram || myMetis?.myDiagram;
        const goLink =
          myMetis?.currentLink ||
          myMetis?.gojsModel?.findLink?.(link?.key) ||
          myDiagram?.findLinkForKey?.(link?.key);
        
        if (goLink && myDiagram) {
          try {
            // Update the link's data property so GoJS bindings trigger
            if (myDiagram.model?.setDataProperty) {
              myDiagram.model.setDataProperty(goLink.data, propname, value);
            } else {
              goLink.data[propname] = value;
            }
          } catch {
            // Do nothing
          }
        }
      }
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
      console.log('[UI-MODAL] ========== RELATIONSHIP handleInputChange ==========');
      console.log('[UI-MODAL] propname:', propname, 'value:', value);
      console.log('[UI-MODAL] context.what:', context?.what);
      console.log('[UI-MODAL] myRelview.id:', myRelview?.id, 'myRelview[propname] before:', myRelview?.[propname]);
      
      if (context?.what === "editRelshipview") 
          myItem = myRelview;
      else if (context?.what === "editTypeview") {
          myItem = myTypeview;
      } else // editRelship
          myItem = myRelship;
      if (myItem) {
          console.log('[UI-MODAL] Setting myItem[' + propname + '] =', value);
          myItem[propname] = value;
          console.log('[UI-MODAL] After set, myItem[' + propname + '] =', myItem[propname]);
      }
      
      // CRITICAL: Mark this property as explicitly touched by the user
      // so handleCloseModal knows to persist the change to Redux/localStorage
      if (context?.what === "editRelshipview") {
          // Store in myMetis since context/obj are frozen
          if (!myMetis.__editTracking) myMetis.__editTracking = {};
          const linkKey = obj?.key || obj?.id || link?.key;
          if (linkKey) {
              if (!myMetis.__editTracking[linkKey]) myMetis.__editTracking[linkKey] = {};
              myMetis.__editTracking[linkKey][propname] = true;
              console.log('[UI-MODAL] Marked relship property as touched:', propname, 'for key:', linkKey);
          }
      }
      
      if (context?.what === "editRelshipview") {
          const myDiagram = context?.myDiagram || myMetis?.myDiagram;
          
          // Disable selection changes during the ENTIRE update (including dispatch) to prevent selection box artifacts
          const oldAllowSelect = myDiagram?.allowSelect;
          if (myDiagram) myDiagram.allowSelect = false;
          
          const goLink =
              myMetis.gojsModel?.findLinkByViewId?.(link?.key) ||
              myMetis.gojsModel?.findLink?.(link?.key) ||
              myMetis.currentLink;
          try {
              if (goLink) {
                  goLink[propname] = value;
                  if (goLink.data) {
                      if (myDiagram?.model?.setDataProperty) {
                          myDiagram.model.setDataProperty(goLink.data, propname, value);
                      } else {
                          goLink.data[propname] = value;
                      }
                  }
                  
                  try { goLink.updateTargetBindings?.(); } catch {}
                  try { goLink.invalidateRoute?.(); } catch {}
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
          
          // CRITICAL: Don't dispatch from handleInputChange for editRelshipview!
          // The dispatch would get queued and flushed after modal close, causing
          // unwanted selection box artifacts. handleCloseModal will dispatch
          // with the final values when user clicks Done.
          // 
          // We've already applied the visual change above via setDataProperty,
          // so the user sees immediate feedback without needing to dispatch.
          /*
          try {
              console.log('[UI-MODAL] editRelshipview - preparing dispatch');
              console.log('[UI-MODAL] myRelview[propname]:', myRelview?.[propname], 'propname:', propname, 'value:', value);
              let data = safeClone(new jsn.jsnRelshipView(myRelview));
              console.log('[UI-MODAL] data after jsn.jsnRelshipView:', data?.strokecolor, 'data:', data);
              // Apply delta-only storage: remove attributes that match typeview defaults
              const typeview = myRelview?.typeview;
              if (typeview) {
                  data = applyDeltaStorage(data, typeview);
              }
              console.log('[UI-MODAL] data after applyDeltaStorage:', data?.strokecolor);
              console.log('[UI-MODAL] Dispatching UPDATE_RELSHIPVIEW_PROPERTIES with data:', data);
              myDiagram?.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
              persistRelshipviewEdit(data);
          } catch {
              // Do nothing
          }
          */
          
          // Restore selection setting AFTER everything is done
          if (myDiagram && oldAllowSelect !== undefined) {
              myDiagram.allowSelect = oldAllowSelect;
          }
      }
  }
  if (obj.category === constants.gojs.C_RELSHIPVIEW) {
      const relview = myMetis.findRelationshipView(obj?.id || obj?.key);
      if (relview) {
          myItem = relview;
          try {
              myItem[propname] = value;
          } catch {
              // Do nothing
          }
          const myDiagram = context?.myDiagram || myMetis?.myDiagram;
          const goLink =
              myMetis.gojsModel?.findLinkByViewId?.(relview.id) ||
              myMetis.gojsModel?.findLink?.(relview.id) ||
              myMetis.currentLink;
          try {
              if (goLink) {
                  goLink[propname] = value;
                  if (goLink.data) {
                      if (myDiagram?.model?.setDataProperty) {
                          myDiagram.model.setDataProperty(goLink.data, propname, value);
                      } else {
                          goLink.data[propname] = value;
                      }
                  }
                  try { goLink.updateTargetBindings?.(); } catch {}
                  try { goLink.invalidateRoute?.(); } catch {}
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
              const data = safeClone(new jsn.jsnRelshipView(relview));
              myDiagram?.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
              persistRelshipviewEdit(data);
          } catch {
              // Do nothing
          }
      }
  }
}

export function handleSelectDropdownChange(selected, context) {
  const myDiagram = context.myDiagram;
  const myMetis = context.myMetis as akm.cxMetis;
  const myMetamodel: akm.cxMetaModel = context.myMetamodel;
  const myModel: akm.cxModel = context.myModel;
  const myModelview: akm.cxModelView = context.myModelview;
  let myGoModel: gjs.goModel = context.myGoModel || myMetis?.gojsModel;
  if (!myGoModel && myModelview) {
    myGoModel = new gjs.goModel(myModelview.id, "myModel", myModelview);
    myMetis?.setGojsModel?.(myGoModel);
    context.myGoModel = myGoModel;
  }
  const modalContext = context.modalContext;
  modalContext.selected = selected;
  modalContext.myMetamodel = myMetamodel;
  const dispatchUpdate = (action: any) => {
    try { myDiagram?.dispatch?.(action); } catch (_) {}
    try { myMetis?.myDiagram?.dispatch?.(action); } catch (_) {}
    try { myMetis?.dispatch?.(action); } catch (_) {}
    try { context?.dispatch?.(action); } catch (_) {}
  };
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
      const myDiagram = context.myDiagram;
      const modalContext = context.modalContext;
      // const data = modalContext.data;
      const typename = selected.value;
      modalContext.typename = typename;
      let fromNode = myGoModel?.findNode(modalContext.gjsFromNode);
      if (!fromNode) fromNode = myGoModel?.findNode(modalContext.gjsFromNode?.key);
      const fromPortId = modalContext.portFrom;
      let toNode = myGoModel?.findNode(modalContext.gjsToNode);
      if (!toNode) toNode = myGoModel?.findNode(modalContext.gjsToNode?.key);
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
      if (!reltype) reltype = context.myMetis?.findRelationshipTypeByName2?.(typename, fromType, toType);
      if (!reltype) reltype = myMetamodel.findRelationshipTypeByName?.(typename);
      if (!reltype) reltype = context.myMetis?.findRelationshipTypeByName?.(typename);
      if (reltype) {
        let reltypeview = reltype.typeview;
        if (reltypeview) {
          const modifiedLinkTypeViews = new Array();
          const jsnTypeView = new jsn.jsnRelshipTypeView(reltypeview);
          modifiedLinkTypeViews.push(jsnTypeView);
          modifiedLinkTypeViews?.map(mn => {
            const data = safeClone(mn);
            dispatchUpdate({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
          })
        }
      }
      context.relshiptype = reltype;
      modalContext.relshiptype = reltype;
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
  console.log('[UI-MODAL] handleCloseModal START - what:', what);
  console.log('[UI-MODAL] selectedData:', selectedData);
  console.log('[UI-MODAL] selectedData.category:', selectedData?.category);
  console.log('[UI-MODAL] modalContext.case:', modalContext?.case);
  
  let myDiagram = modalContext.myDiagram;
  if (myDiagram && modalContext.context) myDiagram = modalContext.context.myDiagram;
  const selection = myDiagram.selection;
  const myMetis = props.myMetis as akm.cxMetis;
  const myMetamodel = myMetis.currentMetamodel;
  const myModel     = myMetis.currentModel;
  const myModelview = myMetis.currentModelview;
  const myGoModel   = myMetis.gojsModel;
  const findGoNode = (key: any) =>
    myGoModel?.findNodeByViewId?.(key) ||
    myGoModel?.findNode?.(key) ||
    myDiagram?.findNodeForKey?.(key);
  const findGoLink = (key: any) =>
    myGoModel?.findLinkByViewId?.(key) ||
    myGoModel?.findLink?.(key) ||
    myDiagram?.findLinkForKey?.(key);
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
            // Clean up optional fields that are not present in data (e.g., removed due to typeview default)
            const optionalObjectviewFields = [
              'text', 'template', 'template2', 'figure', 'figure2', 'geometry',
              'group', 'groupLayout', 'icomStyle',
              'fillcolor', 'fillcolor1', 'fillcolor2', 'strokecolor', 'strokecolor2', 'strokewidth',
              'textcolor', 'textcolor2', 'textscale', 'memberscale', 'arrowscale',
              'icon', 'iconpath', 'icon1', 'icon2', 'icon3', 'image',
              'size', 'scale'
            ];
            for (let i = 0; i < optionalObjectviewFields.length; i++) {
              const prop = optionalObjectviewFields[i];
              if (!(prop in data) && (objectview[prop] === undefined || objectview[prop] === null || objectview[prop] === "")) {
                delete objectview[prop];
              }
            }
            return;
          }
        }
      }
    }
  }

  const applyRelshipviewUpdateById = (root: any, data: any) => {
    if (!root?.metis?.models || !data?.id) return;
    let fallbackMatch: any = null;
    for (let mi = 0; mi < root.metis.models.length; mi++) {
      const model = root.metis.models[mi];
      const modelviews = model?.modelviews || [];
      for (let mvi = 0; mvi < modelviews.length; mvi++) {
        const modelview = modelviews[mvi];
        const relshipviews = modelview?.relshipviews || [];
        for (let rvi = 0; rvi < relshipviews.length; rvi++) {
          const relshipview = relshipviews[rvi];
          if (relshipview?.id === data.id) {
            Object.assign(relshipview, data);
            // Clean up optional fields that are not present in data (e.g., removed due to typeview default)
            const optionalRelshipviewFields = [
              'template2', 'arrowscale', 'strokecolor', 'strokewidth',
              'textcolor', 'textscale', 'dash', 'routing', 'curve', 'corner',
              'fromArrow', 'toArrow', 'fromArrowColor', 'toArrowColor'
            ];
            for (let i = 0; i < optionalRelshipviewFields.length; i++) {
              const prop = optionalRelshipviewFields[i];
              if (!(prop in data) && (relshipview[prop] === undefined || relshipview[prop] === null || relshipview[prop] === "")) {
                delete relshipview[prop];
              }
            }
            return;
          }
          const sameRelship = relshipview?.relshipRef && data?.relshipRef && relshipview.relshipRef === data.relshipRef;
          const sameTypeview = !data?.typeviewRef || relshipview?.typeviewRef === data.typeviewRef;
          const sameFrom = !data?.fromobjviewRef || relshipview?.fromobjviewRef === data.fromobjviewRef;
          const sameTo = !data?.toobjviewRef || relshipview?.toobjviewRef === data.toobjviewRef;
          if (!fallbackMatch && sameRelship && sameTypeview && sameFrom && sameTo) {
            fallbackMatch = relshipview;
          }
        }
      }
    }
    if (fallbackMatch) {
      Object.assign(fallbackMatch, data);
      // Clean up optional fields that are not present in data
      const optionalRelshipviewFields = [
        'template2', 'arrowscale', 'strokecolor', 'strokewidth',
        'textcolor', 'textscale', 'dash', 'routing', 'curve', 'corner',
        'fromArrow', 'toArrow', 'fromArrowColor', 'toArrowColor'
      ];
      for (let i = 0; i < optionalRelshipviewFields.length; i++) {
        const prop = optionalRelshipviewFields[i];
        if (!(prop in data) && (fallbackMatch[prop] === undefined || fallbackMatch[prop] === null || fallbackMatch[prop] === "")) {
          delete fallbackMatch[prop];
        }
      }
    }
  }

  const applyRelshiptypeUpdateById = (root: any, data: any) => {
    if (!root?.metis?.metamodels || !data?.id) return;
    for (let mi = 0; mi < root.metis.metamodels.length; mi++) {
      const metamodel = root.metis.metamodels[mi];
      const relshiptypes = metamodel?.relshiptypes || [];
      for (let rti = 0; rti < relshiptypes.length; rti++) {
        const relshiptype = relshiptypes[rti];
        if (relshiptype?.id === data.id) {
          Object.assign(relshiptype, data);
          return;
        }
      }
    }
  }

  const applyRelshiptypeviewUpdateById = (root: any, data: any) => {
    if (!root?.metis?.metamodels || !data?.id) return;
    for (let mi = 0; mi < root.metis.metamodels.length; mi++) {
      const metamodel = root.metis.metamodels[mi];
      const relshiptypeviews = metamodel?.relshiptypeviews || [];
      for (let rtvi = 0; rtvi < relshiptypeviews.length; rtvi++) {
        const relshiptypeview = relshiptypeviews[rtvi];
        if (relshiptypeview?.id === data.id) {
          Object.assign(relshiptypeview, data);
          return;
        }
      }
    }
  }

  const dispatchUpdate = (action: any) => {
    const store = getCurrentStore();
    try { myDiagram?.dispatch?.(action); } catch (_) {}
    try { myMetis?.myDiagram?.dispatch?.(action); } catch (_) {}
    try { myMetis?.dispatch?.(action); } catch (_) {}
    try { props?.dispatch?.(action); } catch (_) {}
    try { modalContext?.context?.dispatch?.(action); } catch (_) {}
    try { store?.dispatch?.(action); } catch (_) {}
    const getPersistedBase = () => ({
      phData: props?.phData ? JSON.parse(JSON.stringify(props.phData)) : undefined,
      phFocus: props?.phFocus ? JSON.parse(JSON.stringify(props.phFocus)) : undefined,
      phUser: props?.phUser ? JSON.parse(JSON.stringify(props.phUser)) : undefined,
      phSource: props?.phSource ? JSON.parse(JSON.stringify(props.phSource)) : undefined,
    });
    const updatePersistedMemoryState = (applyUpdate: (phData: any) => void) => {
      try {
        const rawStored = window?.sessionStorage?.getItem(MEMORY_STATE_STORAGE_KEY) || window?.localStorage?.getItem(MEMORY_STATE_STORAGE_KEY);
        const parsedStored = rawStored ? JSON.parse(rawStored) : getPersistedBase();
        applyUpdate(parsedStored?.phData);
        persistMemoryState(parsedStored);
      } catch (_) {}
    };
    if (action?.type === 'UPDATE_OBJECTVIEW_PROPERTIES' && action?.data?.id) {
      try { applyObjectviewUpdateById(props?.phData, action.data); } catch (_) {}
      updatePersistedMemoryState((phData: any) => applyObjectviewUpdateById(phData, action.data));
    }
    if (action?.type === 'UPDATE_RELSHIPVIEW_PROPERTIES' && action?.data?.id) {
      try { applyRelshipviewUpdateById(props?.phData, action.data); } catch (_) {}
      updatePersistedMemoryState((phData: any) => applyRelshipviewUpdateById(phData, action.data));
    }
    if (action?.type === 'UPDATE_RELSHIPTYPE_PROPERTIES' && action?.data?.id) {
      try { applyRelshiptypeUpdateById(props?.phData, action.data); } catch (_) {}
      updatePersistedMemoryState((phData: any) => applyRelshiptypeUpdateById(phData, action.data));
    }
    if (action?.type === 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES' && action?.data?.id) {
      try { applyRelshiptypeviewUpdateById(props?.phData, action.data); } catch (_) {}
      updatePersistedMemoryState((phData: any) => applyRelshiptypeviewUpdateById(phData, action.data));
    }
  }

  const pushPhDataUpdate = (data: any) => {
    if (!props?.phData?.metis || !data?.id) return;
    try {
      const store = getCurrentStore();
      const phDataClone = JSON.parse(JSON.stringify(props.phData));
      applyObjectviewUpdateById(phDataClone, data);
      try { dispatchUniversePhData(props?.dispatch, phDataClone); } catch (_) {}
      try { dispatchUniversePhData(modalContext?.context?.dispatch, phDataClone); } catch (_) {}
      try { dispatchUniversePhData(store?.dispatch, phDataClone); } catch (_) {}
    } catch (_) {}
  }

  const pushPhDataRelshipviewUpdate = (data: any) => {
    if (!props?.phData?.metis || !data?.id) return;
    try {
      const store = getCurrentStore();
      const phDataClone = JSON.parse(JSON.stringify(props.phData));
      applyRelshipviewUpdateById(phDataClone, data);
      try { dispatchUniversePhData(props?.dispatch, phDataClone); } catch (_) {}
      try { dispatchUniversePhData(modalContext?.context?.dispatch, phDataClone); } catch (_) {}
      try { dispatchUniversePhData(store?.dispatch, phDataClone); } catch (_) {}
      try {
        const persistSnapshot = () => {
          const snapshot = {
            phData: phDataClone,
            phFocus: props?.phFocus,
            phUser: props?.phUser,
            phSource: props?.phSource,
          };
          persistMemoryState(snapshot);
        };
        persistSnapshot();
        window?.setTimeout?.(persistSnapshot, 150);
      } catch (_) {}
    } catch (_) {}
  }

  switch(what) {
    case "editObjectType": {
      // selObj is a node representing an objecttype
      const selObj = selectedData;
      const node = myDiagram.findNodeForKey(selObj.key);
      if (node) node.isSelected = true;
      let type = selObj.objecttype || modalContext?.myContext?.objecttype;
      type = myMetis.findObjectType(type?.id) || type;
      if (!type) break;
      const data = node?.data;
      for (let k in type) {
        if (k === 'id') continue;
        if (typeof(type[k]) === 'object')    continue;
        if (typeof(type[k]) === 'function')  continue;
        if (!uic.isPropIncluded(k, type))    continue;
        type[k] = selObj[k];
        if (node) myDiagram.model.setDataProperty(data, k, type[k]);
      }
      if (node) node.isSelected = false;
      // Do the dispatches — jsnObjectType includes mutated .properties
      const jsnObjtype = new jsn.jsnObjectType(type, true);
      modifiedObjtypes.push(jsnObjtype);
      modifiedObjtypes.map(mn => {
        const data = safeClone(mn);
        dispatchUpdate({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
      })
      break;
    }
    case "editRelationshipType": {
      // selObj is a link representing a relationship type
      const selObj = selectedData;
      const rel = selectedData;
      let link = myDiagram.findLinkForKey(rel.key);
      if (!link)
          break;
      let type = rel.type || rel.relshiptype || rel.reltype;
      const data = link.data;
      type = link.relshiptype || link.reltype || data.relshiptype || data.reltype || type;
      type = myMetis.findRelationshipType(type?.id) || type;
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
      try {
        myDiagram.model.setDataProperty(link.data, 'reltype', type);
        myDiagram.model.setDataProperty(link.data, 'relshiptype', type);
      } catch (_) {}
      // Do the dispatches
      const jsnReltype = new jsn.jsnRelationshipType(type, true);
      modifiedReltypes.push(jsnReltype);
      modifiedReltypes.map(mn => {
        const data = safeClone(mn);
        dispatchUpdate({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
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
      const goNode = findGoNode(selObj.key);
      const objview =
        modalContext?.myContext?.objectview ||
        myModelview.findObjectView(selObj.key) ||
        goNode?.objectview ||
        goNode?.data?.objectview;
      if (!objview) {
        if (debug) console.log("editObject: missing objview", selObj);
        break;
      }
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
      const goLink = findGoLink(selRel.key);
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
        relship[k] = rel[k];
        if (k === 'name') {
          relview.name = rel[k];
          try {
            if (goLink) goLink.name = rel[k];
            if (gjsLink) gjsLink.name = rel[k];
          } catch (_) {}
        }
        if (k === constants.props.DRAFT) {
          myDiagram.model.setDataProperty(gjsData, 'name', rel[k]);
        }
        try {
        myDiagram.model.setDataProperty(gjsData, k, rel[k]);
        } catch (e) {}
      }
      try {
        myDiagram.model.setDataProperty(gjsData, 'relshipview', relview);
      } catch (e) {}
      try {
        myDiagram.model.setDataProperty(gjsData, 'name', relship.name);
      } catch (e) {}
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
      try { gjsLink.updateTargetBindings?.(); } catch {}
      try { gjsLink.invalidateRoute?.(); } catch {}
      try {
        myDiagram?.updateAllTargetBindings?.('name');
        myDiagram?.requestUpdate?.();
      } catch {}
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
      const goNode = findGoNode(selObj.key);
      const objview =
        modalContext?.myContext?.objectview ||
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
      const keepBoolean = (nextValue: any, ...fallbacks: any[]) => {
        if (nextValue === true || nextValue === false) return nextValue;
        if (nextValue === 'true') return true;
        if (nextValue === 'false') return false;
        for (let i = 0; i < fallbacks.length; i++) {
          const candidate = fallbacks[i];
          if (candidate === true || candidate === false) return candidate;
          if (candidate === 'true') return true;
          if (candidate === 'false') return false;
        }
        return false;
      };
      const isUnsetObjectviewValue = (candidate: any) =>
        candidate === undefined || candidate === null || candidate === "";
      const sameObjectviewValue = (left: any, right: any) => {
        if (left === right) return true;
        if (isUnsetObjectviewValue(left) && isUnsetObjectviewValue(right)) return true;
        if (left === undefined || left === null || right === undefined || right === null) return false;
        return String(left) === String(right);
      };
      const resolvedTypeview =
        goNode?.typeview ||
        goNode?.data?.typeview ||
        objview?.typeview ||
        myMetis?.findObjectTypeView?.(objview?.typeviewRef) ||
        myMetis?.findObject?.(objview?.objectRef || objview?.object?.id)?.type?.typeview;
      const touchedExplicitProps = {
        ...(modalContext?.myContext?.__touchedExplicitProps || {}),
        ...(selObj?.__touchedExplicitProps || {}),
        ...(modalContext?.myContext?.__touchedSelectProps || {}),
        ...(selObj?.__touchedSelectProps || {}),
        ...(myMetis?.__editTracking?.[selObj?.key] || {}), // From handleInputChange
      };
      const typeviewValueFor = (prop: string) => {
        const directValue = resolvedTypeview?.[prop];
        if (directValue !== undefined) return directValue;
        return resolvedTypeview?.data?.[prop];
      };
      const persistObjectviewValue = (prop: string, nextValue: any, currentValue: any, fallbackValue: any) => {
        // Rule: only persist if user provided an explicit non-empty override
        if (isUnsetObjectviewValue(nextValue)) {
          // User left field empty → don't store it, remove if present
          return undefined;
        }
        if (touchedExplicitProps?.[prop] === true) {
          // User explicitly touched pulldown/checkbox field; persist explicit choice
          return nextValue;
        }
        if (isUnsetObjectviewValue(currentValue) && !isUnsetObjectviewValue(fallbackValue) && sameObjectviewValue(nextValue, fallbackValue)) {
          // User set value but it matches typeview default (first-time edit) → don't store it
          return undefined;
        }
        if (!isUnsetObjectviewValue(currentValue) && sameObjectviewValue(nextValue, fallbackValue)) {
          // User changed value back to match typeview → remove override
          return undefined;
        }
        // User provided explicit override → store it
        return nextValue;
      };
      
      // Define all persistable visual properties that need filtering
      const persistableProps = [
        'fillcolor', 'fillcolor1', 'fillcolor2', 'strokecolor', 'strokecolor2', 'strokewidth',
        'textcolor', 'textcolor2', 'textscale', 'memberscale', 'arrowscale'
      ];
      const optionalObjectviewProps = [
        'text', 'template', 'template2', 'figure', 'figure2', 'geometry',
        'group', 'groupLayout', 'icomStyle',
        'fillcolor', 'fillcolor1', 'fillcolor2', 'strokecolor', 'strokecolor2', 'strokewidth',
        'textcolor', 'textcolor2', 'textscale', 'memberscale', 'arrowscale',
        'icon', 'iconpath', 'icon1', 'icon2', 'icon3', 'image',
        'size', 'scale'
      ];
      const removeEmptyOptionalObjectviewFields = (view: any) => {
        if (!view) return;
        for (let i = 0; i < optionalObjectviewProps.length; i++) {
          const prop = optionalObjectviewProps[i];
          if (isUnsetObjectviewValue(view[prop])) {
            delete view[prop];
          }
        }
      };
      
      // First, assign non-filtered properties (schema properties)
      objview.viewkind = selObj.viewkind;
      objview.template = selObj.template;
      objview.template2 = selObj.template2;
      objview.icon = selObj.icon;
      objview.figure = selObj.figure;
      objview.figure2 = selObj.figure2;
      objview.groupLayout = selObj.groupLayout;
      const nextGrabIsAllowed = selObj.grabIsAllowed === true || selObj.grabIsAllowed === 'true';
      objview.grabIsAllowed = nextGrabIsAllowed;
      
      // Apply persistence filtering to visual properties
      for (const prop of persistableProps) {
        const userValue = selObj[prop];
        const currentValue = objview[prop];
        const typeviewValue = typeviewValueFor(prop);
        const storedValue = persistObjectviewValue(prop, userValue, currentValue, typeviewValue);
        
        if (storedValue === undefined) {
          // Remove field if it should not be stored (empty or matches typeview)
          delete objview[prop];
        } else {
          // Store the override value
          objview[prop] = storedValue;
        }
      }
      // Cleanup pass: remove legacy empty optional fields from existing objectviews
      removeEmptyOptionalObjectviewFields(objview);
      goNode.viewkind = selObj.viewkind;
      goNode.template = selObj.template;
      goNode.template2 = selObj.template2;
      goNode.icon = selObj.icon;
      goNode.figure = selObj.figure;
      goNode.figure2 = selObj.figure2;
      // For goNode rendering, use keepValue with typeview fallback since objview may not have the field
      goNode.fillcolor = keepValue(objview.fillcolor, typeviewValueFor('fillcolor'), goNode?.data?.fillcolor);
      goNode.fillcolor2 = keepValue(objview.fillcolor2, typeviewValueFor('fillcolor2'), goNode?.data?.fillcolor2);
      goNode.strokecolor = keepValue(objview.strokecolor, typeviewValueFor('strokecolor'), goNode?.data?.strokecolor);
      goNode.strokecolor2 = keepValue(objview.strokecolor2, typeviewValueFor('strokecolor2'), goNode?.data?.strokecolor2);
      goNode.strokewidth = keepValue(objview.strokewidth, typeviewValueFor('strokewidth'), goNode?.data?.strokewidth);
      goNode.textcolor = keepValue(objview.textcolor, typeviewValueFor('textcolor'), goNode?.data?.textcolor);
      goNode.textcolor2 = keepValue(objview.textcolor2, typeviewValueFor('textcolor2'), goNode?.data?.textcolor2);
      goNode.textscale = keepValue(objview.textscale, typeviewValueFor('textscale'), goNode?.data?.textscale);
      goNode.memberscale = keepValue(objview.memberscale, typeviewValueFor('memberscale'), goNode?.data?.memberscale);
      goNode.arrowscale = keepValue(objview.arrowscale, typeviewValueFor('arrowscale'), goNode?.data?.arrowscale);
      goNode.groupLayout = selObj.groupLayout;
      goNode.grabIsAllowed = nextGrabIsAllowed;
      try { goNode.objectview = objview; } catch {}
      try {
        if (goNode.data) {
          goNode.data.objectview = objview;
          goNode.data.grabIsAllowed = nextGrabIsAllowed;
        }
      } catch {}
      uid.updateNodeAndView(selObj, goNode, objview, myDiagram);
      // updateNodeAndView may reapply empty values from selObj; prune again before persisting
      removeEmptyOptionalObjectviewFields(objview);
      const diagramNode = myDiagram.findNodeForKey(selObj.key || objview.id || goNode.key);
      const diagramData = diagramNode?.data || goNode?.data;
      if (diagramData && myDiagram?.model?.setDataProperty) {
        try { myDiagram.model.setDataProperty(diagramData, 'objectview', objview); } catch {}
        try { diagramData.objectview = objview; } catch {}
        myDiagram.model.setDataProperty(diagramData, 'viewkind', objview.viewkind);
        myDiagram.model.setDataProperty(diagramData, 'template', objview.template);
        myDiagram.model.setDataProperty(diagramData, 'template2', objview.template2);
        myDiagram.model.setDataProperty(diagramData, 'icon', objview.icon);
        myDiagram.model.setDataProperty(diagramData, 'figure', objview.figure);
        myDiagram.model.setDataProperty(diagramData, 'figure2', objview.figure2);
        // Use keepValue with typeview fallback for rendering (objview props may be undefined after filtering)
        myDiagram.model.setDataProperty(diagramData, 'fillcolor', keepValue(objview.fillcolor, typeviewValueFor('fillcolor')));
        myDiagram.model.setDataProperty(diagramData, 'fillcolor2', keepValue(objview.fillcolor2, typeviewValueFor('fillcolor2')));
        myDiagram.model.setDataProperty(diagramData, 'strokecolor', keepValue(objview.strokecolor, typeviewValueFor('strokecolor')));
        myDiagram.model.setDataProperty(diagramData, 'strokecolor2', keepValue(objview.strokecolor2, typeviewValueFor('strokecolor2')));
        myDiagram.model.setDataProperty(diagramData, 'strokewidth', keepValue(objview.strokewidth, typeviewValueFor('strokewidth')));
        myDiagram.model.setDataProperty(diagramData, 'textcolor', keepValue(objview.textcolor, typeviewValueFor('textcolor')));
        myDiagram.model.setDataProperty(diagramData, 'textcolor2', keepValue(objview.textcolor2, typeviewValueFor('textcolor2')));
        myDiagram.model.setDataProperty(diagramData, 'textscale', keepValue(objview.textscale, typeviewValueFor('textscale')));
        myDiagram.model.setDataProperty(diagramData, 'memberscale', keepValue(objview.memberscale, typeviewValueFor('memberscale')));
        myDiagram.model.setDataProperty(diagramData, 'arrowscale', keepValue(objview.arrowscale, typeviewValueFor('arrowscale')));
        myDiagram.model.setDataProperty(diagramData, 'grabIsAllowed', nextGrabIsAllowed);
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
        persistedObjview.viewkind = objview.viewkind;
        persistedObjview.template = objview.template;
        persistedObjview.template2 = objview.template2;
        persistedObjview.icon = objview.icon;
        persistedObjview.figure = objview.figure;
        persistedObjview.figure2 = objview.figure2;
        persistedObjview.groupLayout = objview.groupLayout;
        persistedObjview.isGroup = objview.isGroup;
        persistedObjview.grabIsAllowed = nextGrabIsAllowed;
        // Apply filtered properties (may be undefined if removed due to typeview default)
        for (const prop of persistableProps) {
          if (objview[prop] !== undefined) {
            persistedObjview[prop] = objview[prop];
          } else {
            delete persistedObjview[prop];
          }
        }
        removeEmptyOptionalObjectviewFields(persistedObjview);
      }
      if (debug) console.log("editObjectview: ", selObj);

      // Do dispatch
      const jsnObjview = new jsn.jsnObjectView(objview);
  let data = safeClone(jsnObjview);
  data.grabIsAllowed = nextGrabIsAllowed;
  if (objview.memberscale !== undefined) data.memberscale = objview.memberscale;
  else delete data.memberscale;
  if (objview.arrowscale !== undefined) data.arrowscale = objview.arrowscale;
  else delete data.arrowscale;
  if (objview.textscale !== undefined) data.textscale = objview.textscale;
  else delete data.textscale;
  removeEmptyOptionalObjectviewFields(data);
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
      
      // Clean up tracking data to prevent memory leaks
      if (myMetis?.__editTracking && selObj?.key) {
        delete myMetis.__editTracking[selObj.key];
      }
      
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
      const selRel = selectedData;
      
      // Store and disable allowSelect to prevent selection artifacts
      const oldAllowSelect = myDiagram?.allowSelect;
      try {
        myDiagram?.clearSelection();
        if (myDiagram) myDiagram.allowSelect = false;
      } catch {}
      
      const gjsLink = myDiagram.findLinkForKey(selRel.key);
      if (!gjsLink) break;
      const gjsData = gjsLink.data;
      const goLink = findGoLink(selRel.key);
      let relview = myModelview.findRelationshipView(selRel.key);
      if (!goLink || !relview) break;
      goLink.template2 = selRel.template2;
      relview.template2 = selRel.template2;
      let relship = relview.relship;
      const reltype = relship.type;
      const reltypeview = reltype.typeview;
      const touchedExplicitProps = {
        ...(modalContext?.myContext?.__touchedExplicitProps || {}),
        ...(selRel?.__touchedExplicitProps || {}),
        ...(modalContext?.myContext?.__touchedSelectProps || {}),
        ...(selRel?.__touchedSelectProps || {}),
        ...(myMetis?.__editTracking?.[selRel?.key] || {}),
      };
      
      const isUnsetRelshipviewValue = (candidate: any) =>
        candidate === undefined || candidate === null || candidate === "";
      const sameRelshipviewValue = (left: any, right: any) => {
        if (left === right) return true;
        if (isUnsetRelshipviewValue(left) && isUnsetRelshipviewValue(right)) return true;
        if (left === undefined || left === null || right === undefined || right === null) return false;
        return String(left) === String(right);
      };
      const reltypeviewValueFor = (prop: string) => {
        const directValue = reltypeview?.[prop];
        if (directValue !== undefined) return directValue;
        return reltypeview?.data?.[prop];
      };
      const persistRelshipviewValue = (nextValue: any, currentValue: any, fallbackValue: any) => {
        if (isUnsetRelshipviewValue(nextValue)) return undefined;
        if (!isUnsetRelshipviewValue(fallbackValue) && sameRelshipviewValue(nextValue, fallbackValue)) return undefined;
        return nextValue;
      };
      const keepRelshipviewValue = (nextValue: any, ...fallbacks: any[]) => {
        if (nextValue !== undefined && nextValue !== null && nextValue !== "") return nextValue;
        for (let i = 0; i < fallbacks.length; i++) {
          const candidate = fallbacks[i];
          if (candidate !== undefined && candidate !== null && candidate !== "") return candidate;
        }
        return nextValue;
      };
      const optionalRelshipviewProps = [
        'template2', 'arrowscale', 'strokecolor', 'strokewidth',
        'textcolor', 'textscale', 'dash', 'routing', 'curve', 'corner',
        'fromArrow', 'toArrow', 'fromArrowColor', 'toArrowColor'
      ];
      const removeEmptyOptionalRelshipviewFields = (view: any) => {
        if (!view) return;
        for (let i = 0; i < optionalRelshipviewProps.length; i++) {
          const prop = optionalRelshipviewProps[i];
          if (isUnsetRelshipviewValue(view[prop])) {
            delete view[prop];
          }
        }
      };
      const selection = myDiagram.selection;
      
      // Skip updates if user closed modal without editing
      const hasUserEdits = touchedExplicitProps && Object.keys(touchedExplicitProps).length > 0;
      
      if (!hasUserEdits) {
        // Skip updates when no user edits detected
      } else {
        selection.each(function(sel) {
          const selRel = selectedData;
          let relview = selRel.relshipview;
          if (!relview) 
            relview = myModelview.findRelationshipView(selRel.key);
          if (relview) {
            for (let prop in reltypeview?.data) {
              if (prop === 'class') continue;
              try { relview[prop] = selRel[prop]; } catch {}
            }
            myMetis.addRelationshipView(relview);
          }
        });
      }
      if (gjsLink && relview) {         
        const data = gjsLink.data;
        const previousRouting = relview?.routing || data?.routing || reltypeview?.data?.routing || "Normal";
        const previousCurve = relview?.curve || data?.curve || reltypeview?.data?.curve || "None";
        const relviewProps = Array.from(new Set([
          ...Object.keys(reltypeview?.data || {}),
          ...Object.keys(selRel || {}),
          'name',
          'description',
          'template',
          'template2',
          'arrowscale',
          'strokecolor',
          'strokewidth',
          'textcolor',
          'textscale',
          'dash',
          'routing',
          'curve',
          'corner',
          'fromArrow',
          'toArrow',
          'fromArrowColor',
          'toArrowColor',
        ].filter((prop) => isPersistableRelshipviewProp(prop, selRel?.[prop]))));
        
        // CRITICAL: Check if ANY properties actually changed before updating
        let hasChanges = false;
        const changedProps: string[] = [];
        relviewProps.forEach((prop) => {
          const nextValue = normalizeRelshipviewEditableValue(prop, selRel?.[prop]);
          if (nextValue === undefined) return;
          const currentValue = relview?.[prop];
          const fallbackValue = reltypeviewValueFor(prop);
          const shouldFilterByDefault = optionalRelshipviewProps.includes(prop);
          const storedValue = shouldFilterByDefault
            ? (touchedExplicitProps?.[prop] === true ? nextValue : persistRelshipviewValue(nextValue, currentValue, fallbackValue))
            : nextValue;
          
          // Check if this property changed
          const dataValue = data?.[prop];
          if (storedValue !== dataValue) {
            hasChanges = true;
            changedProps.push(prop);
          }
        });
        
        // Skip ALL updates if user didn't explicitly edit
        if (!hasUserEdits) {
          try {
            if (myDiagram && oldAllowSelect !== undefined) {
              myDiagram.allowSelect = oldAllowSelect;
            }
          } catch {}
          break;
        }
        
        // Apply changes to GoJS diagram model
        myDiagram.model.commit((m: any) => {
          relviewProps.forEach((prop) => {
            const nextValue = normalizeRelshipviewEditableValue(prop, selRel?.[prop]);
            if (nextValue === undefined) return;
            const currentValue = relview?.[prop];
            const fallbackValue = reltypeviewValueFor(prop);
            const shouldFilterByDefault = optionalRelshipviewProps.includes(prop);
            const storedValue = shouldFilterByDefault
              ? (touchedExplicitProps?.[prop] === true ? nextValue : persistRelshipviewValue(nextValue, currentValue, fallbackValue))
              : nextValue;
            if (storedValue === undefined) {
              try { delete relview[prop]; } catch (_) {}
              try { if (relview?.data) delete relview.data[prop]; } catch (_) {}
              const renderValue = keepRelshipviewValue(undefined, fallbackValue);
              try { m.set(data, prop, renderValue); } catch (_) {}
            } else {
              try { relview[prop] = storedValue; } catch (_) {}
              try { if (relview?.data) relview.data[prop] = storedValue; } catch (_) {}
              try { m.set(data, prop, storedValue); } catch (_) {}
            }
          });
        }, 'editRelshipview-close');
        
        removeEmptyOptionalRelshipviewFields(relview);
        removeEmptyOptionalRelshipviewFields(relview?.data);
        // NOTE: Properties already set in model.commit() above - no need to set again
        const nextRouting = relview?.routing || data?.routing || reltypeview?.data?.routing || "Normal";
        const nextCurve = relview?.curve || data?.curve || reltypeview?.data?.curve || "None";
        if (nextRouting !== previousRouting || nextCurve !== previousCurve) {
          try { relview.points = []; } catch (_) {}
          try { if (relview?.data) relview.data.points = []; } catch (_) {}
          myDiagram.model.commit((m: any) => {
            try { m.set(data, 'points', []); } catch (_) {}
          }, 'clear-link-points');
          try { data.points = []; } catch (_) {}
          try { gjsLink.points = new go.List<go.Point>(); } catch (_) {}
          try { gjsLink.clearPoints?.(); } catch (_) {}
          try { gjsLink.updateRoute?.(); } catch (_) {}
        }
        try { gjsLink.updateTargetBindings?.(); } catch {}
        try { gjsLink.invalidateRoute?.(); } catch {}
        try { myDiagram?.requestUpdate?.(); } catch {}
      }
      const jsnRelview = new jsn.jsnRelshipView(relview);
      
      // Restore explicitly edited properties that delta-only storage might filter out
      const linkKey = selRel?.key;
      if (linkKey && myMetis?.__editTracking?.[linkKey]) {
        const explicitEdits = myMetis.__editTracking[linkKey];
        Object.keys(explicitEdits).forEach((prop) => {
          if (explicitEdits[prop] === true && relview?.[prop] !== undefined) {
            jsnRelview[prop] = relview[prop];
          }
        });
      }
      
      modifiedRelviews.push(jsnRelview);
      modifiedRelviews.map(mn => {
        const data = safeClone(mn);
        removeEmptyOptionalRelshipviewFields(data);
        dispatchUpdate({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
        pushPhDataRelshipviewUpdate(data)
      });
      
      // Save to localStorage after Redux reducer completes
      setTimeout(() => {
        try {
          const store = getCurrentStore();
          const state = store?.getState?.();
          if (state) {
            const persistedState = {
              phData: state.phData,
              phFocus: state.phFocus,
              phUser: state.phUser,
              phSource: state.phSource,
            };
            persistMemoryState(persistedState);
          }
        } catch (err) {}
      }, 100);
      
      // Clear selection immediately
      try {
        myDiagram.clearSelection();
      } catch {}
      
      // Clean up tracking data
      if (myMetis?.__editTracking && selRel?.key) {
        delete myMetis.__editTracking[selRel.key];
      }
      
      // Multiple deferred clears to handle async updates
      const diagram = myDiagram;
      const restoreAllowSelect = oldAllowSelect;
      
      setTimeout(() => { try { diagram?.clearSelection(); } catch {} }, 50);
      setTimeout(() => { try { diagram?.clearSelection(); } catch {} }, 100);
      setTimeout(() => { try { diagram?.clearSelection(); } catch {} }, 300);
      setTimeout(() => {
        try {
          diagram?.clearSelection();
          if (restoreAllowSelect !== undefined) {
            diagram.allowSelect = restoreAllowSelect;
          }
        } catch {}
      }, 600);
      
      break;
    }
    case "editTypeview": {   
      // To be done !!!

      // selObj is a node representing an object or an objecttype
      const selObj = selectedData;
      const isMetamodelObjectTypeNode =
        myMetis?.modelType === 'Metamodelling' &&
        (!!selObj?.objecttype || !!selObj?.objtypeRef);
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
      if (selObj.category === constants.gojs.C_OBJECTTYPE || isMetamodelObjectTypeNode) {
        let node = myMetis.currentNode;
        node = myDiagram.findNodeForKey(node.key);
        data = node.data;
        objtypeview = data.typeview || selObj.typeview || data.objecttype?.typeview;
        typeview = myMetamodel.findObjectTypeView(objtypeview?.id);
        
        // Collect all properties that need to be updated - both from selObj and typeview.data
        const allObjProps = new Set([...Object.keys(selObj), ...(objtypeview?.data ? Object.keys(objtypeview.data) : [])]);
        
        allObjProps.forEach(prop => {
          if (prop === 'id') return;
          if (prop === 'name') return;
          if (prop === 'abstract') return;
          if (prop === 'category') return;
          if (prop === 'class') return;
          
          // Skip if selObj doesn't have this property (not changed in form)
          if (selObj[prop] === undefined) return;
          
          typeview[prop] = selObj[prop];
          typeview.data[prop] = selObj[prop];
          myDiagram.model.setDataProperty(data, prop, selObj[prop]);
        });
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
          // Set arrows based on relationship kind if specified
          if (selObj.relshipkind) {
            typeview.setFromArrow2(selObj.relshipkind);
            typeview.setToArrow2(selObj.relshipkind);
          }
          
          // **FIX: Ensure all properties are synced from typeview to link data**
          // Most updates happen in handleInputChange, but ensure arrows and special cases are handled
          if (link.updateLink) {
            link.updateLink(data, myDiagram);
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
