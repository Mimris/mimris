// @ts-nocheck
const debug = false;

import * as utils from './utilities';
import * as akm from './metamodeller';
import * as gjs from './ui_gojs';
import * as gql from './ui_graphql';
const constants = require('./constants');


export function askForTargetModel(context: any, create: boolean) {
    const myMetis = context.myMetis;
    const myModel = context.myModel;
    const models = myMetis.models;
    let mlist = "";
    for (let i=0; i<models.length; i++) {
        const m = models[i];
        if (i == 0) 
            mlist = "'" + m.name + "'";
        else 
            mlist += ",'" + m.name + "'";;
    }
    let mname = "";
    if (!create) 
        mname = prompt("Enter Model as one of " + mlist, myModel.name);
    else 
        mname = prompt("Enter Mmodel name");
    if (mname == null || mname == "") {
        alert("Operation was cancelled!");
        return;
    } else {
        let model = myMetis.findModelByName(mname); 
        if (debug) console.log('33 askForTargetModel', model, myMetis);
        if (create && model) {
            alert("Model already exists");
            return;
        }
        if (!model) {
            if (confirm("Create new model '" + mname + "' ?")) {
                model = new akm.cxModel(utils.createGuid(), mname);
                if (debug) console.log('41 ui_generateTypes', mname, model);
                myMetis.addModel(model);
            } else {
                alert("Operation was cancelled!");
                return;
            }
        }
        if (debug) console.log('48 myMetis', myMetis);
        return model;
    }
}

export function askForMetamodel(context: any, create: boolean, hideEKA: boolean) {
    const myMetis = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const metamodels = myMetis.metamodels;
    if (debug) console.log('56 ui_gererateTypes', context);
    
    let mmlist = "";
    for (let i=0; i<metamodels.length; i++) {
        const mm = metamodels[i];
        // if (mm.name === 'EKA Metamodel') {
        //     i--;
        //     continue;
        // }
        if (i == 0) {
            mmlist = "'" + mm.name + "'";
        } else 
            mmlist += ",'" + mm.name + "'";;
    }
    let mmname = "";
    if (!create) 
        mmname = prompt("Enter Metamodel as one of " + mmlist, myMetamodel.name);
    else 
        mmname = prompt("Enter Metamodel name");
    if (mmname == null || mmname == "") {
        alert("Operation was cancelled!");
        return;
    } else {
        let metamodel = myMetis.findMetamodelByName(mmname); 
        if (create && metamodel) {
            alert("Metamodel already exists");
            return;
        }
        if (debug) console.log('67 askForMetamodel', myMetis);
        if (!metamodel) {
            if (confirm("Create new metamodel '" + mmname + "' ?")) {
                metamodel = new akm.cxMetaModel(utils.createGuid(), mmname);
                myMetis.addMetamodel(metamodel);
            } else {
                alert("Operation was cancelled!");
                return;
            }
        }
        if (debug) console.log('72 myMetis', myMetis);
        return metamodel;
    }
} 

export function askForTargetMetamodel(context: any, create: boolean) {
    const myMetis = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const myTargetMetamodel = context.myTargetMetamodel;
    const metamodels = myMetis.metamodels;
    if (debug) console.log('102 myTargetMetamodel', myTargetMetamodel);
    let mmlist = "";
    for (let i=0; i<metamodels.length; i++) {
        const mm = metamodels[i];
        if (i == 0) 
            mmlist = "'" + mm.name + "'";
        else 
            mmlist += ",'" + mm.name + "'";;
    }
    let mmname = "";
    if (!create) 
        mmname = prompt("Enter Target Metamodel as one of " + mmlist, myTargetMetamodel?.name);
    else 
        mmname = prompt("Enter Target Metamodel name");
    if (mmname == null || mmname == "") {
        alert("Operation was cancelled!");
        return;
    } else {
        const metamodel = myMetis.findMetamodelByName(mmname); 
        if (create && metamodel) {
            alert("Target Metamodel already exists");
            return;
        } else if (!create && !metamodel) {
            alert("Target metamodel does not exist!");
            return;
        }
        if (debug) console.log('131 askForTargetMetamodel', myMetis);
        if (create && !metamodel) {
            if (confirm("Create new targetmetamodel '" + mmname + "' ?")) {
                metamodel = new akm.cxMetaModel(utils.createGuid(), mmname);
                if (metamodel) {
                    const goMetamodel = new gjs.goModel(utils.createGuid(), metamodel.name);
                    goMetamodel.metamodel = metamodel;
                    if (debug) console.log('138 New Metamodel', goMetamodel);
                    const modifiedMetamodels = new Array();
                    modifiedMetamodels.push(goMetamodel);
                    modifiedMetamodels.map(mn => {
                        let data = mn;
                        if (debug) console.log('143 data', data);
                        context.dispatch({ type: 'SET_GOJS_METAMODEL', data });
                    });
                }
                myMetis.addMetamodel(metamodel);
            } else {
                alert("Operation was cancelled!");
                return;
            }
        }
        myMetis.currentTargetMetamodel = metamodel;
        if (debug) console.log('154 myMetis', myMetis);
        return metamodel;
    }
} 

export function generateObjectType(object: akm.cxObject, objview: akm.cxObjectView, context: any) {
    const myMetis     = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const myTargetMetamodel = context.myTargetMetamodel;
    const myModel     = context.myModel;
    if (!object) {
        return;
    }
    if (debug) console.log('167 myMetis', myMetis);
    const obj = myMetis.findObject(object.id);
    if (debug) console.log('169 obj', obj);
    let proptypes  = new Array();
    let objtype = myTargetMetamodel?.findObjectTypeByName(obj.name);
    if (!objtype) {
        // New object type - Create it
        objtype = new akm.cxObjectType(utils.createGuid(), obj.name, obj.description);
        const properties = obj?.type?.properties;
        if (properties !== undefined && properties !== null && properties.length > 0)
            objtype.properties = properties;
        else
            objtype.properties = new Array();
        myTargetMetamodel?.addObjectType(objtype);
        myMetis.addObjectType(objtype);
        if (debug) console.log('179 myMetis', myMetis);
        // Create objecttypeview
        const id = utils.createGuid();
        const objtypeview = new akm.cxObjectTypeView(id, id, objtype, obj.description);
        objtypeview.applyObjectViewParameters(objview);
        if (debug) console.log('184 generateObjectType', objtypeview);
        objtype.typeview = objtypeview;
        objtype.typeviewRef = objtypeview.id;
        objtype.setModified(true);
        myMetis.addObjectTypeView(objtypeview);
        if (myTargetMetamodel) {
            myTargetMetamodel.addObjectTypeView(objtypeview);
            if (!myTargetMetamodel.objtypegeos) 
                myTargetMetamodel.objtypegeos = new Array();
            const objtypegeo = new akm.cxObjtypeGeo(utils.createGuid(), myTargetMetamodel, objtype, "0 0", "100 50");
            myMetis.addObjtypeGeo(objtypegeo);
            myTargetMetamodel.objtypegeos.push(objtypegeo);
        } 
        if (debug) console.log('197 generateObjectType', myMetis);
    } else {
        objtype = myMetis.findObjectType(objtype.id);
    }
    if (debug) console.log('201 myMetis', myMetis);
    let parentType: akm.cxObjectType | null = null;
    if (objtype) {
        objtype.setModified(true);
        parentType = obj.type;
       // Connect objtype to parentType
        // First check if it already exists
        let parentRelType = myMetis.findRelationshipTypeByName2("Is", objtype, parentType);
         if (!parentRelType) {
            parentRelType  = new akm.cxRelationshipType(utils.createGuid(), 'Is', objtype, parentType, "");
            parentRelType.setModified(true);
            parentRelType.setRelshipKind('Generalization');
            myMetamodel.addRelationshipType(parentRelType);
            myMetis.addRelationshipType(parentRelType);
        }
        console.log('219 objtype, parentType, parentRelType', objtype, parentType, parentRelType);
        if (debug) console.log('220 generateObjectType', myMetis);
        // Find properties connected to current object
        const rels = obj?.findOutputRelships(myModel, constants.relkinds.REL);
        if (debug) console.log('231 rels to properties', rels);
        if (!rels) {
            return null;
        } else {
            for (let i=0; i < rels.length; i++) {
                let rel = rels[i];
                console.log('237 rel', rel);
                if (rel.toObject?.type.name === constants.types.AKM_PROPERTY) {
                    if (rel.name === constants.types.AKM_HAS_PROPERTY) {
                        const proptype = rel.getToObject();
                        if (debug) console.log('241 proptype', proptype);
                        // Check if property type already exists
                        for (let j=0; j<proptypes.length; j++) {
                            if (proptype.name === proptypes[j].name)
                                continue;
                        }
                        if (debug) console.log('247 proptype', proptype);
                        proptypes.push(proptype);
                    }
                }
            }
        }
    }         
    if (debug) console.log('246 generateObjectType', proptypes);
    for (let i=0; i < proptypes.length; i++) {
        // Check if property already exists
        let proptype = proptypes[i];
        let prop = objtype.findPropertyByName(proptype.name);
        if (!prop) {
            // New property - create it
            prop = new akm.cxProperty(utils.createGuid(), proptype.name, proptype.description);
            let datatype = myMetis.findDatatypeByName("string");
            prop.setDatatype(datatype);
            objtype.addProperty(prop);
        }
        if (prop) {
            // Find datatype connected to current property
            let rels = proptype.findOutputRelships(myModel, constants.relkinds.REL);
            if (rels) {
                for (let i=0; i < rels.length; i++) {
                    let rel = rels[i];
                    if (!rel.deleted) {
                        if (rel.name === constants.types.AKM_IS_OF_DATATYPE) {
                            let dtype = rel.toObject;
                            if (dtype) {
                                let datatype = myMetis.findDatatypeByName(dtype.name);
                                if (datatype) prop.setDatatype(datatype);
                            }
                        }
                        if (rel.name === constants.types.AKM_HAS_UNIT) {
                            let u = rel.toObject;
                            if (u) {
                                let unit = myMetis.findUnitByName(u.name);
                                if (unit) prop.setUnit(unit);
                            }
                        }
                    }
                    myTargetMetamodel?.addProperty(prop);
                    myMetis.addProperty(prop); 
                }                           
            }
        }
    }
    if (debug) console.log('286 generateObjectType', myMetis, objtype);
    return objtype;
}

export function generateRelshipType(relship: akm.cxRelationship, relview: akm.cxRelationshipView, context: any) {
    const myMetis     = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const myTargetMetamodel = context.myTargetMetamodel;
    const myModel     = context.myModel;
    if (!relship) {
        return;
    }
    const rel  = myMetis.findRelationship(relship.id);
    const fromObj  = rel.getFromObject();
    const fromtype = myTargetMetamodel.findObjectTypeByName(fromObj?.name);
    const toObj    = rel.getToObject();
    const totype   = myTargetMetamodel.findObjectTypeByName(toObj?.name);
    const relname  = rel.getName();
    let reltype    = myTargetMetamodel.findRelationshipTypeByNames(relname, fromtype.name, totype.name);
    if (!reltype) {
        // New relationship type - Create it
        reltype = new akm.cxRelationshipType(utils.createGuid(), relname, fromtype, totype, rel.description);
        
        myTargetMetamodel.addRelationshipType(reltype);
        myMetis.addRelationshipType(reltype);
        console.log('311 relshiptype', reltype);
        let reltypeview = new akm.cxRelationshipTypeView(utils.createGuid(), rel.name, reltype, rel.description);
        reltypeview.applyRelationshipViewParameters(relview);
        reltype.typeview = reltypeview;
        myTargetMetamodel.addRelationshipTypeView(reltypeview);
        myMetis.addRelationshipTypeView(reltypeview);
        return reltypeview;
    }
}

export function generateDatatype(obj: akm.cxObject, context: any) {
    const myMetis  = context.myMetis;
    const myModel  = context.myModel;
    const object   = myMetis.findObject(obj.id);
    const name     = object.name;
    const descr    = object.description;
    const myMetamodel = context.myMetamodel;
    const myTargetMetamodel = context.myTargetMetamodel;

    let datatype   = myTargetMetamodel.findDatatypeByName(name);
    if (!datatype) {
        datatype = new akm.cxDatatype(utils.createGuid(), name, descr);
        myMetis.addDatatype(datatype);
    }
    if (datatype) {
        // Check if it has a parent datatype
        const rels = object.findOutputRelships(myModel, constants.relkinds.REL);
        if (rels) {
            let values  = new Array();
            for (let i=0; i < rels.length; i++) {
                let rel = rels[i];
                let obj = rel.toObject;
                let type = obj.type;
                if (type.name === constants.types.AKM_DATATYPE) {
                    let dtype = myTargetMetamodel.findDatatypeByName(obj.name);
                    datatype.setIsOfDatatype(dtype);
                    // Find allowed values if any
                    if (utils.isArrayEmpty(rels)) {
                        return false;
                    } else {
                        for (let i=0; i < rels.length; i++) {
                            let rel = rels[i];
                            if (rel.name === constants.types.AKM_HAS_ALLOWED_VALUE) {
                                let valueObj = rel.toObject;
                                // Check if allowed value already exists
                                for (let j=0; j<values.length; j++) {
                                    if (valueObj.name === values[j].value)
                                        continue;
                                }
                                values.push(valueObj.getName());
                            }
                            else if (rel.getName() === constants.types.AKM_IS_DEFAULTVALUE) {
                                let valueObj = rel.toObject;
                                datatype.setDefaultValue(valueObj.name);
                            }
                        }
                    }
                }
            }
            for (let i=0; i< values.length; i++) {
                datatype.addAllowedValue(values[i]);
            }
        }
        myTargetMetamodel.addDatatype(datatype);
        if (debug) console.log('374 generateDatatype', myMetis);
        return datatype;
    }
}

export function generateUnit(object: akm.cxObject, context: any) {
    const myMetis      = context.myMetis;
    const myMetamodel  = context.myMetamodel;
    let name     = object.name;
    let descr    = object.description;
    let unit     = myMetis.findUnitByName(name);
    if (!unit) {
        unit = new akm.cxUnit(utils.createGuid(), name, descr);
        myMetamodel.addUnit(unit);
        myMetis.addUnit(unit);
    } else 
        myMetamodel.addUnit(unit);
    return unit;
}

export function generateTargetMetamodel(targetmetamodel: akm.cxMetaModel, sourcemodelview: akm.cxModelView, context: any) {
    const currentMetamodel = context.myMetamodel;
    const myMetis   = context.myMetis;
    const metamodel = targetmetamodel;
    const modelview = sourcemodelview;
    context.myMetamodel = metamodel; 
    if (!modelview)
        return false;
    const model = modelview.model;  // Concept model
    // Define the metamodel type:s
    // Look up the Task object type and connect it to the metamodel
    let objtype;
    objtype = myMetis.findObjectTypeByName('Task');
    if (objtype)
        metamodel.addObjectType(objtype);
    // Look up the Role object type and connect it to the metamodel
    objtype = myMetis.findObjectTypeByName('Role');
    if (objtype)
        metamodel.addObjectType(objtype);
    // Look up the View object type and connect it to the metamodel
    objtype = myMetis.findObjectTypeByName('View');
    if (objtype)
        metamodel.addObjectType(objtype);
    // Look up the View object type and connect it to the metamodel
    objtype = myMetis.findObjectTypeByName('Property');
    if (objtype)
        metamodel.addObjectType(objtype);
    // Generate the types defined in the concept model, 
    //  and connect them all to the metamodel:
    // Look up the datatype objects
    let objects;
    objects = model?.getObjectsByTypename('Datatype', false);
    // For each Datatype object call generateDatatype
    if (objects) {
        for (let i=0; i<objects.length; i++) {
            let obj = objects[i];
            if (obj)
                generateDatatype(obj);
        }
    }
    // Look up the Unit objects
    objects = model?.getObjectsByTypename('Unit', false);
    // For each unit object call generateUnit
    if (objects) {
        for (let i=0; i<objects.length; i++) {
            let obj = objects[i];
            if (obj)
                generateUnit(obj, context);
        }
    }
    // Look up the Information objects
    const objectviews = modelview.objectviews;
    if (objectviews) {
        for (let i=0; i<objectviews.length; i++) {
            let objview = objectviews[i];
            if (!objview) 
                continue;
            let type = myMetis.findObjectTypeByName('Information');
            let obj = objview.object;
            if (obj && obj.type) {
                if (obj.type.inherits(type)) {
                    generateObjectType(obj, objview, context);
                }
            }
        }
    }
    // For each object call generateObjectType
    // Look up the relationships between Roles and Tasks
        // For each relship, get relship type and add to metamodel
    // Look up the relationships between Tasks and Informations
        // For each relship, get relship type and add to metamodel

    alert("Target metamodel has been successfully generated!");
    context.myMetamodel = currentMetamodel;
    return true;
}

export function generateTargetModel(currentTargetModelview, sourceModelview) {
    if (!sourceModelview) return;
    let model = sourceModelview.getModel();
    if (!model) return;

    let selection     = new Array();
    let selectionInfo = new Array();
    // First handle object views
    let objectviews = sourceModelview.getObjectViews();
    for (let i=0; i<objectviews.length; i++) {
        let objview = objectviews[i];
        if (!objview) continue;
        let obj = objview.getObject();
        if (!obj) continue;
        let objtype = obj.getType();
        if (!objtype) continue;
        if (objtype.getName() === 'Task') selection.push(objview);
        if (objtype.getName() === 'Role') selection.push(objview);
        if (objtype.getName() === 'View') selection.push(objview);
        if (objtype.getName() === 'Informatiom') selectionInfo.push(objview); // Her bør vi ta hensyn toil arv
    }
    // selection is an array of objectviews to be copied to targetmodelview
    for (let i=0; i<selection.length; i++) {
        let objview = selection[i];
        copyObjectview(objview, currentTargetModelview);
    }
    
    /* selection is an array of objectviews to be copied to targetmodelview
    for (let i=0; i<selectionInfo.length; i++) {
        let objview = selectionInfo[i];
        copyObjectview(objview, currentTargetModelview);
    }
    */
    
    // Then handle relationship views
    selection = new Array();
    let relshipviews = sourceModelview.getRelationshipViews();
    for (let i=0; i<relshipviews.length; i++) {
        let relview = relshipviews[i];
        if (!relview) continue;
        let rel = relview.getRelationship();
        if (!rel) continue;
        let reltype = rel.getType();
        if (!reltype) continue;
        let fromview = relview.getFromObjectView();
        let fromtype = fromview.object.type.name;
        let toview   = relview.getToObjectView();
        let totype   = toview.object.type.name;
        if (fromtype === 'Task' || fromtype === 'Role' || fromtype === 'View') {
            if (totype === 'Task' || totype === 'Role' || totype === 'View') {
                selection.push(relview);
            }
        }
/*
        for (let i=0; i<selection.length; i++) {
            let relview = selection[i];
            copyRelshipview(relview, currentTargetModelview);
        }
*/        
    } 
}

export function copyObjectview(fromObjview, toModelview) {
    let ov = fromObjview;
    let obj = ov.object;
    let toModel = toModelview.getModel();
    let toObj: cxObject | null = null;
    /*
    let objtype = obj.getType();
    if (objtype.getName() === 'Information') {
        let o = toModel.findObjectByTypeAndName(objtype, objname);
    }
    */
    toObj   = toModel.findObjectByName(obj.getName());
    if (!toObj) {
        toObj = new akm.cxObject(utils.createGuid(), obj.name, obj.type, obj.description);
        toModel.addObject(toObj);
        metis.addObject(toObj);
    }
    // Then copy properties
    // Then create the new objectview
    let toObjview   = toModelview.findObjectViewByName(obj.getName());
    if (!toObjview) {
        toObjview = new akm.cxObjectView(utils.createGuid(), ov.name, toObj, ov.description);
        toObjview.object = toObj;
        toObjview.loc    = fromObjview.loc;
        toObjview.size   = fromObjview.size;
    }
    let fromTypeview = fromObjview.typeview;
    let toTypeview = new akm.cxObjectTypeView(utils.createGuid(), fromTypeview.name, fromTypeview.type, "");
    for (let prop in fromTypeview.data) {
        toTypeview.data[prop] = fromTypeview.data[prop];
    }
    toObjview.typeview = toTypeview;
    toObj.addObjectView(toObjview);
    metis.addObjectTypeView(toTypeview);
    toModelview.addObjectView(toObjview);
    metis.addObjectView(toObjview);
}

export function copyRelshipview(fromRelview, toModelview) {
    let rv = fromRelview;
    let fromRel = rv.relship;
    let fromObj = fromRel.getFromObject();
    let toObj   = fromRel.getToObject();
    let toModel = toModelview.getModel();
    let fromObjCopy = toModel.findObjectByName(fromObj.name);
    let fromObjView = toModelview.findObjectViewByName(fromObj.name);
    let toObjCopy   = toModel.findObjectByName(toObj.name);
    let toObjView   = toModelview.findObjectViewByName(toObj.name);
    let toRel       = toModel.findRelationship(fromObjCopy, toObjCopy, fromRel.type);
    if (!toRel && fromObjCopy && toObjCopy) {
        toRel = new akm.cxRelationship(utils.createGuid(), fromRel.type, fromObjCopy, toObjCopy, fromRel.name, fromRel.description);
        toModel.addRelationship(toRel);
        metis.addRelationship(toRel);
    
        // Then copy properties
        let toRelview = toModelview.findRelationshipViewByName(fromRel.name);
        if (!toRelview) {
            toRelview = new akm.cxRelationshipView(utils.createGuid(), fromRel.name, toRel, rv.description);
        }
        if (toRelview) {
            let fromTypeview = fromRelview.typeview;
            let toTypeview = new akm.cxRelationshipTypeView(utils.createGuid(), fromTypeview.name, fromTypeview.type, "");
            /*
            for (let prop in fromTypeview.data) {
                if (prop === 'id') continue;
                if (prop === 'abstract') continue;
                if (prop === 'deleted') continue;
                if (prop === 'relshiptypeRef') continue;
                toTypeview.data[prop] = fromTypeview.data[prop];
            }
            */
            toRelview.typeview = toTypeview;
            //myTargetMetamodel.addRelationshipTypeView(toTypeview);
            metis.addRelationshipTypeView(toTypeview);
            /**/
            toRelview.setFromObjectView(fromObjView);
            toRelview.setToObjectView(toObjView);

            toRel.addRelationshipView(toRelview);
            toModelview.addRelationshipView(toRelview);
            metis.addRelationshipView(toRelview);
        }
    }
}
