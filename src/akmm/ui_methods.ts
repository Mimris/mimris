// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;

// import * as go from 'gojs';
import * as akm from '../akmm/metamodeller';
import * as gjs from '../akmm/ui_gojs';
import * as jsn from './ui_json';
// import * as uic from '../akmm/ui_common';
// import * as gen from '../akmm/ui_generateTypes';
import * as utils from '../akmm/utilities';
import * as constants from '../akmm/constants';
// import exp from 'constants';
const RegexParser = require("regex-parser");

export function addConnectedObjects(modelview: akm.cxModelView, objview: akm.cxObjectView, 
                                    goModel: gjs.goModel, myMetis: akm.cxMetis, noLevels: number) {
    if (noLevels < 1)
        return;
    const objectviews = [];
    const myDiagram = myMetis.myDiagram;
    const modifiedObjectViews = new Array();
    const modifiedRelshipViews = new Array();
    let object = objview.object;
    if (object)
        object = myMetis.findObject(object.id);
    if (objview && object) {
        const nodeLoc = objview.loc.split(" ");
        const nx = parseInt(nodeLoc[0]);
        const ny = parseInt(nodeLoc[1]);
        const objtype = object.type;
        // objtype = object.type;
        if (objtype && objtype.isContainer()) {
            objview.viewkind = constants.viewkinds.CONT;
        }
        for (let useinp = 0; useinp < 2; useinp++) {
            let rels  = useinp ? object.inputrels : object.outputrels;
            if (rels) {
                let cnt = 0;
                for (let i=0; i<rels.length; i++) {
                    let rel = rels[i];
                    if (!rel)
                        continue;
                    if (rel.markedAsDeleted)
                        continue;
                    rel = myMetis.findRelationship(rel.id) as akm.cxRelationship;
                    let toObj;
                    if (useinp) 
                        toObj = rel.fromObject as akm.cxObject;
                    else
                        toObj = rel.toObject as akm.cxObject;
                    if (debug) console.log('46 toObj', toObj);
                    toObj = myMetis.findObject(toObj.id);
                    if (!toObj || toObj.markedAsDeleted)
                        continue;
                    if (objtype) {
                        if (toObj.type.id !== objtype.id)
                        continue;
                    }
                    const toObjtype = toObj.type;
                    const toObjtypeview = toObjtype.typeview;
                    const toTypeviewData = toObjtypeview.data;
                    const toObjviews = toObj.objectviews;
                    if (debug) console.log('57 toObjtypeview, toObjviews', toObjtypeview, toObjviews);
                    // Find toObj in modelview
                    const objviews = modelview.findObjectViewsByObj(toObj);
                    let toObjview;
                    if (objviews && objviews.length >0) {
                        for (let j=0; j<objviews.length; j++) {   
                            const oview = objviews[j];
                            if (oview.markedAsDeleted)
                                continue; 
                            if (toObjtype.isContainer())
                                oview.viewkind = constants.viewkinds.CONT;
                            if (debug) console.log('1625 Create relship views to objviews', object, objviews);
                        }
                        // Create relship views and links to the found objviews if they do not exist
                        let relviews;
                        if (useinp) {
                            relviews = modelview.findRelationshipViewsByRel2(rel, toObjview, objview);
                            if (relviews.length == 0) i++;
                        } else {
                            relviews = modelview.findRelationshipViewsByRel2(rel, objview, toObjview);
                            if (relviews?.length == 0) i++;
                        }
                        if (debug) console.log('1637 rel, relview', rel, relviews);                    
                        // if (relviews.length > 0)
                        //     continue;    
                    } else {
                        cnt++;
                        // Create an objectview of toObj and then a node
                        // Then create a relship view and a link from object to toObj
                        if (debug) console.log('86 Create an object view and a relship view', object);
                        const id1 = utils.createGuid();
                        toObjview = new akm.cxObjectView(id1, toObj.name, toObj, "");
                        toObj.addObjectView(toObjview);
                        modelview.addObjectView(toObjview);
                        myMetis.addObjectView(toObjview);
                        if (debug) console.log('92 toObjview', toObj, toObjview);
                        const goNode = new gjs.goObjectNode(utils.createGuid(), toObjview);
                        if (toObjviews) {
                        const oview = toObjviews[0];
                        for (let prop in toTypeviewData) {
                            if (oview[prop] !== "") {
                                toObjview[prop] = oview[prop];
                                myDiagram.model.setDataProperty(goNode, prop, oview[prop]);
                            } else
                                myDiagram.model.setDataProperty(goNode, prop, toTypeviewData[prop]);
                        }
                        } else {
                            for (let prop in toTypeviewData) {
                                myDiagram.model.setDataProperty(goNode, prop, toTypeviewData[prop]);
                            }
                        }
                        const diff = 100; // noLevels>0 ? 50 : 100;
                        const locx = useinp ? nx - 300 : nx + 300;
                        const locy = ny - diff + cnt * 100;
                        const loc = locx + " " + locy;
                        toObjview.loc = loc;
                        goNode.loc = loc;
                        if (debug) console.log('114 goNode', goNode);
                        goModel.addNode(goNode);
                        myDiagram.model.addNodeData(goNode);
                        const gjsNode = myDiagram.findNodeForKey(goNode?.key)
                        gjsNode.isSelected = true;
                        const jsnObjview = new jsn.jsnObjectView(toObjview);
                        modifiedObjectViews.push(jsnObjview);
                    }
                    if (toObjview)
                        objectviews.push(toObjview);
                    const oviewFrom = useinp ? toObjview : objview;
                    const oviewTo = useinp ? objview : toObjview;
                    const relviews2 = modelview.findRelationshipViewsByRel2(rel, oviewFrom, oviewTo);
                    if (!relviews2 || relviews2?.length == 0) {
                        const id2 = utils.createGuid();
                        const relview = new akm.cxRelationshipView(id2, rel.name, rel, "");
                        relview.fromObjview = oviewFrom;
                        relview.toObjview = oviewTo;
                        rel.addRelationshipView(relview);
                        modelview.addRelationshipView(relview);
                        myMetis.addRelationshipView(relview);
                        const jsnRelView = new jsn.jsnRelshipView(relview);
                        modifiedRelshipViews.push(jsnRelView);
                        if (debug) console.log('137 relview', relview);
                        const goLink = new gjs.goRelshipLink(utils.createGuid(), goModel, relview);
                        goLink.loadLinkContent(goModel);
                        goModel.addLink(goLink);
                        myDiagram.model.addLinkData(goLink);
                        if (debug) console.log('142 goModel', goModel); 
                    }                   
                }
            }
        }
        myDiagram.requestUpdate();
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
    if (debug) console.log('156 objectviews', objectviews);
    if (noLevels > 1) {
        noLevels--;
        for (let i=0; i<objectviews?.length; i++) {
            const oview = objectviews[i];
            addConnectedObjects(modelview, oview, null, goModel, myMetis, noLevels);
        }
    }
}

function conditionIsFulfilled(object, context): boolean {
    let retval = true;
    const myMetis = context.myMetis;
    const myMetamodel    = context.myMetamodel;
    const method = context.args.method;
    const typecondition  = method["typecondition"];  
    const valuecondition = method["valuecondition"]; 
    const objtype = typecondition ? myMetamodel.findObjectTypeByName(typecondition) : null;
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

export function traverse(object: akm.cxObject, context: any) {
    const myMetis        = context.myMetis;
    const myMetamodel    = context.myMetamodel;
    const method         = context.args.method;
    const objects        = context.objects;
    const relships       = context.relships;
    const reldir         = method["reldir"];   // Either 'in' or 'out'
    const reltypename    = method["reltype"];
    let pre_action       = method["preaction"];
    let post_action      = method["postaction"];

    if (debug) console.log('211 objects, relships', objects, relships);
    if (conditionIsFulfilled(object, context)) {
        if (pre_action) {
            if (typeof(pre_action === 'string')) {
                context.mode = "preaction";
                context.action = pre_action;
                execMethod(object, context);
            } else 
                pre_action(object, context);
        }
    }    
    let reltype;
    if (reltypename) { // Check if reltype is specified
        try {
            reltype = myMetamodel.findRelationshipTypeByName(reltypename);
        } catch {
            reltype = myMetis.findRelationshipTypeByName(reltypename);
        }
    }
    const useinp = (reldir === 'in');
    const useoutp = (reldir === 'out');
    let rels  = useinp ? object.inputrels : object.outputrels;
    if (!rels) 
        rels = object.inputrels;
    if (rels) 
        rels.concat(object.outputrels);
    else
        rels = object.outputrels;
    if (rels) {
        if (debug) console.log('226 rels', rels);
        let foundRel = false;
        for (let i=0; i<rels.length; i++) {
            const rel = rels[i];
            // Check if reltype is specified
            if (reltype && (rel?.type.id !== reltype?.id))
                continue;
            for (let i=0; i<relships.length; i++) {
                const r = relships[i];
                if (rel.id === r.id) {
                    foundRel = true;
                    break;
                }
            }
            if (!foundRel)
                relships.push(rel);
            let toObj;
            if (rel.toObject.id === object.id) {
                toObj = rel.fromObject as akm.cxObject;
                if (debug) console.log('260 useinp: toObj', toObj);
            } else if (rel.fromObject.id === object.id) {
                toObj = rel.toObject as akm.cxObject;
                if (debug) console.log('263 useoutp: toObj', toObj);
            }
            if (debug) console.log('265 rel, toObj', rel, toObj);
            let foundObj = false;
            if (toObj) {
                for (let i=0; i<objects.length; i++) {
                    const obj = objects[i];
                    if (obj.id === toObj.id) {
                        foundObj = true;
                        break;
                    }
                }
            }
            if (!foundObj && toObj) {
                objects.push(toObj);
            }           
            if (debug) console.log('282 toObj, objects, relships', toObj, objects, relships);
            // Recursive traverse       
            if (!foundObj && toObj) {
                traverse(toObj, context);
                if (conditionIsFulfilled(toObj, context)) {
                    if (post_action) {
                        if (typeof(post_action === 'string')) {
                            context.mode = "postaction";
                            context.action = post_action;
                            execMethod(toObj, context);
                        } else 
                            post_action(toObj, context);
                    }
                }
            }
        }
    } 
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
                    if (debug) console.log('215 parent', parent);
                    break;
                }
            }
        }
    }
    let parentUid = "";
    if (parent)
        parentUid = parent.getStringValue2(method["propname"]);
    if (debug) console.log('275 parentUid: ', parentUid);
        let osduId = object.name;
    if (parentUid && parentUid.length > 0)
        osduId = parentUid + '|' + object.name;
    object.setStringValue2(method["propname"], osduId);
    if (debug) console.log('280 osduId: ', osduId);

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

function hasChildren(object: akm.cxObject, context: any): boolean {
    let retval = false;
    const reltype   = context.reltype;
    const reldir    = context.reldir;
    const useinp    = (reldir === 'in');
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
    if (debug) console.log('374 object, context', object, context);
    const objects: akm.cxObject[] = [];
    const reltype   = context.reltype;
    const reldir    = context.reldir;
    const objtype   = context.objtype;
    const useinp    = reldir ? (reldir === 'in') : false;
    let rels  = useinp ? object.inputrels : object.outputrels;
    if (debug) console.log('381 object, rels', object, rels);
    if (!rels) 
        rels = object.inputrels;
    if (rels) {
        const outrels = object.outputrels;
        if (outrels)
            rels.concat(outrels);
    } else
        rels = object.outputrels;
    if (debug) console.log('390 object, rels', object, rels);
    if (rels) {
        for (let i=0; i<rels?.length; i++) {
            const rel = rels[i];
            let child;
            if (reltype) {
                if (rel?.type?.id !== reltype?.id)
                    continue;
            }
            if (useinp) 
                child = rel.fromObject as akm.cxObject;
            else
                child = rel.toObject as akm.cxObject;            
            if (debug) console.log('403 child', child);
            if (child) {
                if (objtype) {
                    if (child.type.id === objtype.id)
                        objects.push(child);
                } else
                    objects.push(child);
            }  
            if (debug) console.log('412 child', child);
        }
    }
    if (debug) console.log('415 object, objects', object, objects);
    return objects;
}

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
    if (debug) console.log('429 object, context, children', object, context, children);
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
    const myMetis   = context.myMetis;
    const prop      = context.prop;
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

export function expandPropScript(object: akm.cxInstance, prop: akm.cxProperty, myMetis: akm.cxMetis): string {
    let retval = "";
    if (!prop)
        return retval;
    const pi = 3.14159265
    let mtd = prop.method;
    if (!mtd) mtd = myMetis.findMethod(prop.methodRef);
    let expression = mtd?.expression;
    if (expression) { 
        const type = object.type;
        expression = substitutePropnamesInExpression(object, expression, myMetis);
        if (debug) console.log('455 expression', expression);
        try {
            retval = eval(expression);
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

export function askForMethod(context: any) {
    if (debug) console.log('433 context', context);
    const currentType = context.myObject.type;
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
    const object = context.myObject;
    let objects = context.objects;
    if (!context.objects) 
        context.objects = [];
    if (!context.relships) 
        context.relships = [];
    if (objects?.length > 10)
        return;
    if (debug) console.log('501 object, context', object, context);
    traverse(object, context);                  
}

function execMethod(object: akm.cxObject, context: any) {
    if (debug) console.log("462: Calling execMethod '" + context.action + "': on " + object.name);
    const myDiagram = context.myDiagram;
    const myMetis = context.myMetis;
    if (debug) console.log('465 myMetis', myMetis);
    const gojsModel = myMetis.gojsModel;
    const node = gojsModel.findNodeByObjectId(object.id);
    if (debug) console.log('468 node', node);
    const gjsNode = myDiagram.findNodeForKey(node?.key);
    switch(context.action) {
        case 'Highlight':
            if (gjsNode) gjsNode.isHighlighted = true;
            break;
        case 'Select':
            if (gjsNode) gjsNode.isSelected = true;
            if (debug) console.log('605 gjsNode', gjsNode);
            break;
        case 'generateosduId':
            context.myObject = object;
            generateosduId(context);
            break;
    }
}