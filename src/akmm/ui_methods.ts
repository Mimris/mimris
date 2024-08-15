// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;

// import * as go from 'gojs';
import * as akm from '../akmm/metamodeller';
import * as gjs from '../akmm/ui_gojs';
import * as uic from '../akmm/ui_common';
import * as uid from '../akmm/ui_diagram';
import * as jsn from './ui_json';
// import * as uic from '../akmm/ui_common';
// import * as gen from '../akmm/ui_generateTypes';
import * as utils from '../akmm/utilities';
import * as constants from '../akmm/constants';
// import exp from 'constants';
const RegexParser = require("regex-parser");

export function askForMethod(context: any) {
    if (debug) console.log('433 context', context);
    const currentType = context.currentObject.type;
    const myDiagram = context.myDiagram;
    const modalContext = {
        what:           "selectDropdown",
        title:          context.title,
        case:           context.case,
        myDiagram:      myDiagram,
        context:        context,
      } 
      const methods = new Array();
      const allMethods = currentType.methods;
      for (let i=0; i<allMethods?.length; i++) {
        const method = allMethods[i];
        if (method.markedAsDeleted)
            continue;
        methods.push(method);
      }
      const mmNameIds = methods.map(mm => mm && mm.nameId);
      if (debug) console.log('452', mmNameIds, modalContext, context);
      myDiagram.handleOpenModal(mmNameIds, modalContext);
}

export function executeMethod(context: any) {
    if (context.traverseViews && context.currentObjectview) {
        let objectviews = context.objectviews;
        if (!context.objectviews) 
            context.objectviews = [];
        if (!context.relshipviews) 
            context.relshipviews = [];
        if (objectviews?.length > 50)
            return;
        traverseViews(context.currentObjectview, context);
    }
    else if (!context.traverseViews && context.currentObject) {
        let objects = context.objects;
        if (!context.objects) 
            context.objects = [];
        if (!context.relships) 
            context.relships = [];
        if (objects?.length > 50)
            return;
        traverse(context.currentObject, context);
    }
}

function execMethod(object: akm.cxObject, context: any) {
    const myDiagram = context.myDiagram;
    const nodes = myDiagram.nodes;
    const modifiedObjectViews = new Array();
    const modifiedRelshipViews = new Array();
    const modifiedObjects = new Array();
    const modifiedRelships = new Array();
    for (let it = nodes.iterator; it?.next();) {
        const node = it.value;
        let obj = node.data.object; 
        let objectRef = obj?.id;
        if (!objectRef)
            objectRef = node.data.objectRef;
        if (objectRef == object.id) {
            switch(context.action) {
                case 'Highlight':
                    node.isHighlighted = true;
                    break;
                case 'Select':
                    node.isSelected = true;
                    break;
                case 'deleteView':
                    const objview = node.data.objectview;
                    deleteView(objview, modifiedObjectViews, modifiedRelshipViews, context);
                    break;
                case 'deleteObject':
                    deleteObject(object, modifiedObjects, modifiedRelships, context);
                    break;
                // case 'deleteRelship':
                case 'addConnectedObject':
                    addConnectedObject(object, context);
                    break;
            }
        }
    }
    // modifiedObjectViews.map(mn => {
    //     let data = (mn) && mn
    //     if (mn.id) {
    //       data = JSON.parse(JSON.stringify(data));
    //       myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
    //     }
    // })
    // modifiedRelshipViews.map(mn => {
    //     let data = (mn) && mn
    //     data = JSON.parse(JSON.stringify(data));
    //     myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    //   })
    // modifiedObjects?.map(mn => {
    //     let data = (mn) && mn
    //     data = JSON.parse(JSON.stringify(data));
    //     myDiagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
    // })
    // modifiedRelships?.map(mn => {
    //     let data = (mn) && mn
    //     data = JSON.parse(JSON.stringify(data));
    //     myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
    //   })
}

export function traverse(obj: akm.cxObject, context: any): boolean {
    const method         = context.args.method;
    if (!method) 
        return false;
    let retval           = true;
    const myMetis        = context.myMetis;
    const myMetamodel    = context.myMetamodel;
    const myModelview    = context.myModelview;
    const objects        = context.objects;
    const relships       = context.relships;
    const reldir         = method["reldir"];   // Either 'in' or 'out' or ''
    const objtypes       = method["objtypes"];
    const reltypes       = method["reltypes"];
    let pre_action       = method["preaction"];
    let post_action      = method["postaction"];
    let level            = context.level;

    if (conditionIsFulfilled(obj, context)) {
        if (pre_action) {
            context.level++;
            if (typeof(pre_action === 'string')) {
                context.mode = "preaction";
                context.action = pre_action;
                execMethod(obj, context);
            } else 
                pre_action(obj, context);
        }
    }    
    let reltype;
    if (reltypes) { // Check if reltype is specified
        // get reltypename from comma separated list
        const reltypename = reltypes.split(',')[0];        
        try {
            reltype = myMetamodel.findRelationshipTypeByName(reltypename);
        } catch {
            reltype = myMetis.findRelationshipTypeByName(reltypename);
        }
    }
    // Check relship direction
    const useinp = (reldir === 'in');
    const useoutp = (reldir === 'out');
    const useany = (!useinp && !useoutp);
    let rels = [];
    if (useinp && obj.inputrels)
        rels = obj.inputrels;
    if (useoutp && obj.outputrels)
        rels = obj.outputrels;
    if (useany) {
        rels = obj.inputrels;
        if (rels)
            rels = rels.concat(obj.outputrels);
        else 
            rels = obj.outputrels;
    }
    // Go through all actual relships
    if (rels) {
        if (debug) console.log('226 rels', rels);
        let foundRel = false;
        for (let i=0; i<rels.length; i++) {
            let rel = rels[i];
            if (!rel) continue;
            // Check if reltype is specified
            if (reltype && (rel?.type.id !== reltype?.id))
                continue;
            // Check if this is a 'new' relship
            for (let i=0; i<relships.length; i++) {
                const r = relships[i];
                if (rel.id === r.id) {
                    foundRel = true;
                    break;
                }
            }
            if (!foundRel)
                relships.push(rel);
            let fromObject = rel.fromObject as akm.cxObject;
            if (!fromObject) {
                fromObject = myMetis.findObject(rel.fromObjectRef) as akm.cxObject;
            }
            let toObject = rel.toObject as akm.cxObject;
            if (!toObject) {
                toObject = myMetis.findObject(rel.toObjectRef) as akm.cxObject;
            }
            if ((useinp || useany) && (toObject.id === obj.id)) {
                toObject = rel.fromObject as akm.cxObject;  ' <------  '
            } else if ((useoutp || useany) && (fromObject.id === obj.id)) {
                toObject = rel.toObject as akm.cxObject;    '  ------> '
            }
            let foundObj = false;
            // Navigate towards toObj
            if (toObject) {
                for (let i=0; i<objects.length; i++) {
                    const obj = objects[i];
                    if (obj.id === toObject.id) {
                        foundObj = true;
                        // Has already been traversed
                        break;
                    }
                }
            }            
            if (!foundObj && toObject) {
                objects.push(toObject);            
                // Recursive traverse       
                method.level++;
                retval = traverse(toObject, context);
                method.noLevels--;
                if (conditionIsFulfilled(toObject, context)) {
                    if (post_action) {
                        if (typeof(post_action === 'string')) {
                            context.mode = "postaction";
                            context.action = post_action;
                            execMethod(toObject, context);
                        } else 
                            post_action(toObject, context);
                    }
                }
            }
        }
    } 
    return retval;
}

export function traverseViews(objview: akm.cxObjectView, context: any): boolean {
    const method         = context.args.method;
    if (!method) 
        return false;
    let retval           = true;
    const myMetis        = context.myMetis;
    const myMetamodel    = context.myMetamodel;
    const myModelview    = context.myCurrentModelview;
    const myGoModel      = context.myGoModel;
    const objects        = context.objects;
    const relships       = context.relships;
    const objectviews    = myModelview.objectviews;
    const relshipviews   = context.relshipviews;
    const reldir         = method["reldir"];   // Either 'in' or 'out' or ''
    const objtypes       = method["objtypes"];
    const reltypes       = method["reltypes"];
    let pre_action       = method["preaction"];
    let post_action      = method["postaction"];
    let noLevels         = parseInt(method["nolevels"]);
    let level            = context.level;

    if (conditionIsFulfilled(objview.object, context)) {
        if (pre_action) {
            context.level++;
            if (typeof(pre_action === 'string')) {
                context.mode = "preaction";
                context.action = pre_action;
                execMethod(objview.object, context);
            } else {
                pre_action(objview.object, context);
            }
        }
    }
    let reltype;
    if (reltypes) { // Check if reltype is specified
        // get reltype from comma separated list
        const reltypename = reltypes.split(',')[0];        
        try {
            reltype = myMetamodel.findRelationshipTypeByName(reltypename);
        } catch {
            reltype = myMetis.findRelationshipTypeByName(reltypename);
        }
    }
    // Check relship direction
    const useinp = (reldir === 'in');
    const useoutp = (reldir === 'out');
    const useany = (!useinp && !useoutp);
    // Get actual relviews
    let relviews = [];
    if (useinp && objview.inputrelviews) 
        relviews = objview.inputrelviews;
    if (useoutp && objview.outputrelviews) 
        relviews = objview.outputrelviews;
    if (useany) {
        relviews = objview.inputrelviews;
        if (relviews)
            relviews = relviews.concat(objview.outputrelviews);
        else 
            relviews = objview.outputrelviews;
    }
    // Go through all actual relviews
    if (relviews) {
        if (debug) console.log('226 rels', rels);
        let foundRelview = false;
        for (let i=0; i<relviews.length; i++) {
            let relview = relviews[i];
            if (!relview) continue;
            // Check if reltype is specified
            if (reltype && (relview.relship?.type?.name !== reltypename))
                continue;
            // Check if this is a 'new' relview
            for (let i=0; i<relviews.length; i++) {
                const rv = relviews[i];
                if (relview.id === rv.id) {
                    foundRelview = true;
                    break;
                }
            }
            if (!foundRelview)
                relviews.push(relview);
            let toObjview;
            if ((useinp || useany) && relview.toObjview?.id === objview.id) {
                toObjview = relview.fromObjview as akm.cxObjectView;  ' <------  '
            } else if ((useoutp || useany) && relview.fromObjview.id === objview.id) {
                toObjview = relview.toObjview as akm.cxObjectView;  ' ------>  '
            }
            let foundObjview = false;
            // Navigate towards toObjview
            if (toObjview) {
                for (let i=0; i<objectviews.length; i++) {
                    const objview = objectviews[i];
                    if (objview.id === toObjview.id) {
                        foundObjview = true;
                        // Has already been traversed
                        break;
                    }
                }
            }
            if (!foundObjview && toObjview) {
                objectviews.push(toObjview);  
            } 
            if (context.level < noLevels) {   
                // Recursive traverse       
                context.level++;
                retval = traverseViews(toObjview, context);
                context.level--;
                if (conditionIsFulfilled(toObjview.object, context)) {
                    if (post_action) {
                        if (typeof(post_action === 'string')) {
                            context.mode = "postaction";
                            context.action = post_action;
                            execMethod(toObjview.object, context);
                        } else 
                            post_action(toObjview.object, context);
                    }
                }
            }                           
        }
    } 
    return retval;
}

function conditionIsFulfilled(object: akm.cxObject, context: any): boolean {
    let retval = true;
    const myMetis = context.myMetis;
    const myMetamodel    = context.myMetamodel;
    const method = context.args.method;
    const objtypecondition  = method["objtypecondition"];  
    const reltypecondition  = method["reltypecondition"];  
    const valuecondition = method["valuecondition"]; // On object
    const objtype = objtypecondition ? myMetamodel.findObjectTypeByName(objtypecondition) : null;
    const otype = object?.type;
    // Check if objtype is specified
    if (objtype && otype) {
        if (otype.id !== objtype.id) 
            retval = false;
    }
    // Check if value condition is specified
    if (retval && valuecondition) {
        const expression = substitutePropnamesInExpression(object, valuecondition, myMetis);        
        try {
            retval = eval(expression);
        } catch(e) {
            if (e instanceof SyntaxError) {
                alert(e.message);
            }
            retval = false;
        }
    }
    return retval;
}

function hasChildren(object: akm.cxObject, context: any): boolean {
    let retval = false;
    const reltypes = context.reltypes;
    // get reltype from comma separated list
    const reltypename  = reltypes ? reltypes.split(',')[0] : null;;
    const reltype = reltypename ? context.myMetamodel.findRelationshipTypeByName(reltypename) : null;
    const reldir   = context.reldir;
    const useinp   = (reldir === 'in');
    const rels  = useinp ? object.inputrels : object.outputrels;
    for (let i=0; i<rels?.length; i++) {
        const rel = rels[i];
        if (!reltype) {
            retval = true;
            break;
        }
        if (rel?.type.id == reltype.id) {
            retval = true;
            break;
        }
    }
    return retval;
}

function getChildren(object: akm.cxObject, context: any): akm.cxObject[] {
    const objects: akm.cxObject[] = [];
    const reltypes = context.reltypes;
    // get reltype from comma separated list
    const reltypename = reltypes ? reltypes.split(',')[0] : null;
    const reltype  = reltypename ? context.myMetamodel.findRelationshipTypeByName(reltypename) : null;
    const reldir   = context.reldir;
    const objtypes = context.objtypes;
    // get objtype from comma separated list
    const objtypename = objtypes ? objtypes.split(',')[0] : null;
    const objtype  = objtypename ? context.myMetamodel.findObjectTypeByName(objtypename) : null;
    const useinp   = reldir ? (reldir === 'in') : false;
    let rels  = useinp ? object.inputrels : object.outputrels;
    if (!rels) 
        rels = object.inputrels;
    if (rels) {
        const outrels = object.outputrels;
        if (outrels)
            rels.concat(outrels);
    } else
        rels = object.outputrels;
    if (rels) {
        for (let i=0; i<rels?.length; i++) {
            const rel = rels[i];
            let child;
            if (reltype) {
                if (rel?.type?.name !== reltype?.name)
                    continue;
            }
            if (useinp) 
                child = rel.fromObject as akm.cxObject;
            else
                child = rel.toObject as akm.cxObject;            
            if (debug) console.log('403 child', child);
            if (child) {
                if (objtype) {
                    if (child.type.name === objtypename)
                        objects.push(child);
                } else
                    objects.push(child);
            }  
        }
    }
    return objects;
}

export function expandPropScript(object: akm.cxInstance, prop: akm.cxProperty, myMetis: akm.cxMetis): string {
    let retval = "";
    if (!prop)
        return retval;
    const pi = 3.14159265
    let mtd = prop.method;
    if (!mtd) mtd = myMetis.findMethod(prop.methodRef);
    let dtype = prop.datatype;
    if (!dtype)
        dtype = myMetis.findDatatype(prop.datatypeRef);
    let expression = mtd?.expression;
    if (expression) { 
        const type = object.type;
        expression = substitutePropnamesInExpression(object, expression, myMetis);
        if (debug) console.log('455 expression', expression);
        try {
            if (expression === 'now') {
                if (dtype?.name === 'date') {
                    const d = new Date();
                    let year = d.getFullYear();
                    let month = d.getMonth()+1;
                    if (month < 10) month = '0' + month;
                    let day = d.getDate();
                    if (day < 10) day = '0' + day;
                    retval = year + '-' + month + '-' + day; 
                } else if (dtype?.name === 'time') {
                    const d = new Date();
                    retval = d.getTime();      
                }
            } else {
                retval = eval(expression);
            }
            if (!retval)
                retval = expression;
        } catch(e) {
            retval = expression;
        }
        if (debug) console.log('464 retval', retval);
    } else {
        retval = object[prop.name];
        if (debug) console.log('467 retval', retval);
    }
    return retval;
}

function substitutePropnamesInExpression(object: akm.cxInstance, expression: string, metis: akm.cxMetis): string {
    let retval = "";
    const type = object.type;
    const props = type.properties;
    if (debug) console.log('472 props', props);
    for (let i=0; i<props.length; i++) {
        const prop = props[i];
        if (expression.indexOf(prop.name) == -1) {
            if (debug) console.log('475 expression, prop', expression, prop);
            continue;
        }
        if (debug) console.log('478 prop', prop);
        const len = prop.name.length;
        const propval = object.getPropertyValue(prop, metis);
        let pos = [];
        let p = 0;
        let px = 0;
        let diff = 0;
        let indx = 0;
        pos.push(p)
        for (let j=0; j<expression.length; j++) {   
            const expr = expression.substring(indx);     
            px = expr.indexOf(prop.name);
            if (px == -1) break;
            if (j == 0) 
                p = px;
            else
                p += px+1;
            diff += px+1;
            // if (p>0)
                pos.push(p);
            indx = p+1;
        }
        if (debug) console.log('500 pos', pos);
        // Substitute all prop.names starting with the last one
        let siz = pos.length;
        if (debug) console.log('503 siz', siz);
        for (let j=siz-1; j>0; j--) {
            let px = pos[j]+len;
            let endstr = expression.substring(px);
            let newExpr = expression.substring(0, pos[j]) + propval + endstr;
            expression = newExpr;
        }
    }
    if (debug) console.log('511 expression', expression);
    return expression;
}

// Actions 
export function calculateValue(object: akm.cxObject, context: any) {
    const myMetis    = context.myMetis;
    const prop       = context.prop;
    let propval;
    let val = expandPropScript(object, prop, myMetis);
    if (utils.isNumeric(val))
        propval = Number(val);
    else
        propval = val;
    return propval;
}

export function aggregateValue(object: akm.cxObject, context: any) {
    let propval = 0;
    const children = getChildren(object, context);
    for (let i=0; i<children?.length; i++) {
        const child = children[i];
        let val;
        if (hasChildren(child, context))
            val = aggregateValue(child, context);
        else
            val = calculateValue(child, context);
        propval += Number(val);
    }
    return propval;
}

export function getConnectedObject(object: akm.cxObject, context: any): akm.cxObject | null {
    const myMetis  = context.myMetis;
    const prop     = context.prop;
    const children = getChildren(object, context);
    if (debug) console.log('431 children', children);
    for (let i=0; i<children?.length; i++) {
        const child = children[i];
        const test = expandPropScript(child, prop, myMetis);
        if (debug) console.log('435 test, child, prop', test, child, prop);
        // Find the first child that fullfills the condition
        if (test)
            return child;   
    }
    return null;
}

export function getConnectedObjects(object: akm.cxObject, context: any): akm.cxObject[] {
    const myMetis   = context.myMetis;
    const prop      = context.prop;
    const objects   = new Array();
    const children = getChildren(object, context);
    if (debug) console.log('431 children', children);
    for (let i=0; i<children?.length; i++) {
        const child = children[i];
        const test = expandPropScript(child, prop, myMetis);
        if (debug) console.log('435 test, child, prop', test, child, prop);
        if (test)
            objects.push(child);
    }
    return objects;
}

export function addConnectedObject(object: akm.cxObject, context: any) {
    const method = context.args.method;
    let noLevels = parseInt(method.nolevels);
    if (noLevels < 1)
        return;
    const myMetis     = context.myMetis as akm.cxMetis;
    const myGoModel   = context.myGoModel;
    const myDiagram   = context.myDiagram;
    const myMetamodel = context.myMetamodel as akm.cxMetamodel;
    const myModel     = context.myModel as akm.cxModel;
    const myModelview = context.myModelview as akm.cxModelview;
    const reldir      = method.reldir;
    const objtypes    = method.objtypes;
    const reltypes    = method.reltypes;
    
    // get connected objects by following the reltypes in the given direction 

    const modifiedObjectViews = new Array();
    const modifiedRelshipViews = new Array();
    const objectviews: akm.cxObjectView[] = new Array();
    const relshipviews: akm.cxRelationshipView[] = new Array();
    const objtypename = objtypes ? objtypes.split(',')[0] : null;
    const objtype: akm.cxObjectType = objtypename ? myMetamodel.findObjectTypeByName(objtypename) : null;
    const reltypename = reltypes ? reltypes.split(',')[0] : null;
    const reltype: akm.cxRelationshipType = reltypename ? myMetamodel.findRelationshipTypeByName(reltypename) : null as akm.cxRelationshipType;
    const useinp = (reldir === 'in');
    const useoutp = (reldir === 'out');
    const useany = (!useinp && !useoutp);
    let rels: akm.cxRelationship[] = [];
    if (useinp && object.inputrels)
        rels = object.inputrels;
    if (useoutp && object.outputrels)
        rels = object.outputrels;
    if (useany) {
        rels = object.inputrels;
        if (rels)
            rels = rels.concat(object.outputrels);
        else 
            rels = object.outputrels;
    }
    if (rels) {
        for (let i=0; i<rels.length; i++) {
            let rel = rels[i];
            if (!rel) continue;
            rel = myMetis.findRelationship(rel.id) as akm.cxRelationship;
            if (reltype) {
                if (rel?.type.name !== reltypename)
                    continue;
            }
            let fromObj: akm.cxObject;
            let fromObjview: akm.cxObjectView;
            let toObj: akm.cxObject;
            let toObjview: akm.cxObjectView;
            if ((useinp || useany) && (rel.fromObject.id === object.id)) {
                fromObj = rel.fromObject as akm.cxObject;  ' <------  '
                toObj   = rel.toObject as akm.cxObject; 
                if (objtype) {
                    if (fromObj.type.name !== objtypename)
                        continue;
                }
            } 
            if ((useoutp || useany) && (rel.toObject.id === object.id)) {
                fromObj = rel.fromObject as akm.cxObject;  ' <------  '
                toObj = rel.toObject as akm.cxObject;    '  ------> '
                if (objtype) {
                    if (toObj.type.name !== objtypename)
                        continue;
                }
            }
            // Create new objectview      
            if (fromObj && toObj) {
                fromObjview = myModelview.findObjectViewByName(fromObj.name);
                if (!fromObjview) {
                    fromObjview = new akm.cxObjectView(utils.createGuid(),fromObj.name, fromObj, "", myModelview);
                    const fromNode = new gjs.goObjectNode(fromObjview.id, myGoModel, fromObjview);
                    myGoModel.addNode(fromNode);
                    myModelview.addObjectView(fromObjview);
                    const fromObjtype = fromObj.type as akm.cxObjectType;
                    const fromObjtypeView = fromObjtype.getDefaultTypeView();
                    uic.updateNode(fromNode, fromObjtypeView, myDiagram, myGoModel);
                    myDiagram.model.addNodeData(fromNode);
                    objectviews.push(fromObjview);
                    const jsnObjectView = new jsn.jsnObjectView(fromObjview);
                    modifiedObjectViews.push(jsnObjectView);
                }
                toObjview = myModelview.findObjectViewByName(toObj.name);
                if (!toObjview) {
                    toObjview = new akm.cxObjectView(utils.createGuid(),toObj.name, toObj, "", myModelview);
                    const toNode = new gjs.goObjectNode(toObjview.id, myGoModel, toObjview);
                    myGoModel.addNode(toNode);
                    myModelview.addObjectView(toObjview);
                    const toObjtype = toObj.type as akm.cxObjectType;
                    const toObjtypeView = toObjtype.getDefaultTypeView();
                    uic.updateNode(toNode, toObjtypeView, myDiagram, myGoModel);
                    myDiagram.model.addNodeData(toNode);
                    objectviews.push(toObjview);
                    const jsnObjectView = new jsn.jsnObjectView(toObjview);
                    modifiedObjectViews.push(jsnObjectView);
                }            
                // Check if relshipview already exists
                let relshipviews: akm.cxRelationshipView[] = myModelview.findRelationshipViewsByRel(rel);
                if (relshipviews.length == 0) {
                    // Create new relshipview
                    const relshipview = new akm.cxRelationshipView(utils.createGuid(), rel.name, rel, "");
                    relshipview.fromObjview = fromObjview;
                    relshipview.toObjview = toObjview;
                    relshipviews.push(relshipview);
                    const jsnRelshipView = new jsn.jsnRelshipView(relshipview);
                    modifiedRelshipViews.push(jsnRelshipView);
                    const goLink = new gjs.goRelshipLink(utils.createGuid(), myGoModel, relshipview);
                    goLink.loadLinkContent(myGoModel);
                    goLink.fromNode = uid.getNodeByViewId(fromObjview.id, myDiagram);
                    goLink.from = goLink.fromNode?.key;
                    myGoModel.addLink(goLink);
                    myDiagram.model.addLinkData(goLink);
                }
                myDiagram.requestUpdate();
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
}

function deleteObject(object: akm.cxObjectType, modifiedObjects: any[], modifiedRelships: any[], context: any) {
    object.markedAsDeleted = true;
    const jsnObject = new jsn.jsnObject(object);
    modifiedObjects.push(jsnObject);
    const relships = object.outputrels;
    if (relships) {
        for (let i=0; i<relships.length; i++) {
            const relship = relships[i];
            relship.markedAsDeleted = true;
            const jsnRelship = new jsn.jsnRelationship(relship);
            modifiedRelships.push(jsnRelship);
        }
    }
}

export function deleteView(objectview: akm.cxObjectView, modifiedObjectViews: any[], modifiedRelshipViews: any[], context: any) {
    const myDiagram = context.myDiagram;
    objectview.markedAsDeleted = true;
    const jsnObjectView = new jsn.jsnObjectView(objectview);
    modifiedObjectViews.push(jsnObjectView);
    const relviews = objectview.outputrelviews;
    if (relviews) {
        for (let i=0; i<relviews.length; i++) {
            const relview = relviews[i];
            relview.markedAsDeleted = true;
            const jsnRelview = new jsn.jsnRelshipView(relview);
            modifiedRelshipViews.push(jsnRelview);
            const link = uid.getLinkByViewId(relview.id, myDiagram);
            if (link) myDiagram.model.removeLinkData(link);
        }
    }
    const node = uid.getNodeByViewId(objectview.id, myDiagram);
    if (node) myDiagram.model.removeNodeData(node);
}

export function generateosduId(context: any) {
    const object = context.myObject;
    const myDiagram = context.myDiagram;
    const myModel = context.myModel;
    const method = context.args.method;
    const reltypename = method.reltype;
    const myMetamodel = myModel.metamodel;
    const reltypes = myMetamodel.findRelationshipTypesByName(reltypename);
    const reldir  = method.reldir;   // Either 'in' or 'out'
    const useinp  = (reldir === 'in');
    let parent: akm.cxObject;
    let rels  = useinp ? object.outputrels : object.inputrels;
    if (rels) {
        for (let i=0; i<rels.length; i++) {
            const rel = rels[i];
            for (let j=0; j<reltypes.length; j++) {
                const reltype = reltypes[j];
                if (rel?.type.name === reltype?.name) {
                    if (useinp) 
                        parent = rel.toObject as akm.cxObject;
                    else
                        parent = rel.fromObject as akm.cxObject;
                    break;
                }
            }
        }
    }
    let parentUid = "";
    if (parent)
        parentUid = parent.getStringValue2(method["propname"]);
        let osduId = object.name;
    if (parentUid && parentUid.length > 0)
        osduId = parentUid + '|' + object.name;
    object.setStringValue2(method["propname"], osduId);

    // UPDATE_OBJECT_PROPERTIES
    const jsnObject = new jsn.jsnObject(object);
    const modifiedObjects = new Array();
    modifiedObjects.push(jsnObject);
    modifiedObjects?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
    });
}
