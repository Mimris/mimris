// @ts -nocheck

import * as utils from './utilities';
import * as akm from './metamodeller';
import * as gjs from './ui_gojs';
import * as gql from './ui_graphql';
const constants = require('./constants');



export function generateObjectType(metamodel, obj, objview) {
    if (!obj) {
        return;
    }
    let proptypes  = new Array();
    let objtype = metamodel.findObjectTypeByName(obj.getName());
    if (!objtype) {
        // New object type - Create it
        objtype = new akm.cxObjectType(utils.createGuid(), obj.getName(), obj.getDescription());
        let properties = obj.getType().getProperties();
        if (properties !== undefined && properties !== null && properties.length > 0)
            objtype.properties = properties;
        metamodel.addObjectType(objtype);
        metis.addObjectType(objtype);
    }
    let parentType: akm.cxObjectType | null = null;
    let parentRelType: akm.cxRelationshipType | null = null;
    if (objtype) {
        parentType = obj.getType();
        // Connect objtype to parentType
        let reltypes = metamodel.findRelationshipTypesBetweenTypes(objtype, parentType, true);
        if (reltypes)) {
            for (let i=0; i<reltypes.length; i++) {
                let reltype = reltypes[i];
                if (reltype.getName() === 'IsA') {
                    parentRelType = reltype;
                    break;
                }
            }
        }
        // First check if it already exists
        if (!parentRelType) {
            parentRelType  = new akm.cxRelationshipType(utils.createGuid(), 'IsA', objtype, parentType, "");
            parentRelType.setRelshipKind('Generalization');
            metamodel.addRelationshipType(parentRelType);
            metis.addRelationshipType(parentRelType);
        }
        if (!metamodel.findObjectTypeViewByName(obj.getName())) {
            let objtypeview = new akm.cxObjectTypeView(utils.createGuid(), obj.getName(), objtype, obj.getDescription());
            objtypeview.applyObjectViewParameters(objview);
            objtype.typeview = objtypeview;
            metamodel.addObjectTypeView(objtypeview);
            metis.addObjectTypeView(objtypeview);
        }

        // Find properties connected to current object
        let rels = obj.findOutputRelships(myModel);
        if (utils.isArrayEmpty(rels)) {
            return null;
        } else {
            for (let i=0; i < rels.length; i++) {
                let rel = rels[i];
                if (rel.getName() === constants.AKM_HAS_PROPERTY) {
                    let proptype = rel.getToObject();
                    // Check if property type already exists
                    for (let j=0; j<proptypes.length; j++) {
                        if (proptype.getName() === proptypes[j].getName())
                            continue;
                    }
                    proptypes.push(proptype);
                }
            }
        }
    }         

    
    for (let i=0; i < proptypes.length; i++) {
        // Check if property already exists
        let proptype = proptypes[i];
        let prop = objtype.findPropertyByName(proptype.name);
        if (!prop) {
            // New property - create it
            prop = new akm.cxProperty(utils.createGuid(), proptype.name, proptype.description);
            objtype.addProperty(prop);
            let datatype = metis.findDatatypeByName("string");
            prop.setDatatype(datatype);
        }
        if (prop)) {
            // Find datatype connected to current property
            let rels = proptype.findOutputRelships(myModel);
            if (!utils.isArrayEmpty(rels)) {
                for (let i=0; i < rels.length; i++) {
                    let rel = rels[i];
                    if (!rel.isDeleted()) {
                        if (rel.getName() === constants.AKM_IS_OF_DATATYPE) {
                            let dtype = rel.getToObject();
                            if (dtype) {
                                let datatype = metis.findDatatypeByName(dtype.name);
                                prop.setDatatype(datatype);
                            }
                        }
                        if (rel.getName() === constants.AKM_HAS_UNIT) {
                            let u = rel.getToObject();
                            if (u) {
                                let unit = metis.findUnitByName(u.name);
                                prop.setUnit(unit);
                            }
                        }
                    }
                }
            }
        }
        metamodel.addProperty(prop);
        metis.addProperty(prop);
    }
    return;
}

export function generateRelshipType(metamodel, rel, relview) {
    if (!rel) {
        return;
    }
    let proptypes  = new Array();
    let fromObj  = rel.getFromObject();
    let fromtype = metamodel.findObjectTypeByName(fromObj.getName());
    let toObj    = rel.getToObject();
    let totype   = metamodel.findObjectTypeByName(toObj.getName());
    let relname  = rel.getName();
    let reltype = metamodel.findRelationshipTypeByNames(relname, fromtype.getName(), totype.getName());
    if (!reltype) {
        // New relationship type - Create it
        reltype = new akm.cxRelationshipType(utils.createGuid(), relname, fromtype, totype, rel.getDescription());
        
        metamodel.addRelationshipType(reltype);
        metis.addRelationshipType(reltype);

        let reltypeview = new akm.cxRelationshipTypeView(utils.createGuid(), rel.getName(), reltype, rel.getDescription());
        reltypeview.applyRelationshipViewParameters(relview);
        reltype.typeview = reltypeview;
        metamodel.addRelationshipTypeView(reltypeview);
        metis.addRelationshipTypeView(reltypeview);
    }
}

export function generateDatatype(object) {
    let name     = object.getName();
    let descr    = object.getDescription();
    let datatype = metis.findDatatypeByName(name);
    if (!datatype) {
        datatype = new akm.cxDatatype(utils.createGuid(), name, descr);
        metis.addDatatype(datatype);
    }
    if (datatype) {
        // Check if it has a parent datatype
        const rels = object.findOutputRelships(myModel);
        let values  = new Array();
        for (let i=0; i < rels.length; i++) {
            let rel = rels[i];
            let obj = rel.getToObject();
            let type = obj.getType();
            if (type.getName() === constants.AKM_DATATYPE) {
                let dtype = metis.findDatatypeByName(obj.getName());
                datatype.setIsOfDatatype(dtype);
                // Find allowed values if any
                if (utils.isArrayEmpty(rels)) {
                    return false;
                } else {
                    for (let i=0; i < rels.length; i++) {
                        let rel = rels[i];
                        if (rel.getName() === constants.AKM_HAS_ALLOWED_VALUE) {
                            let valueObj = rel.getToObject();
                            // Check if allowed value already exists
                            for (let j=0; j<values.length; j++) {
                                if (valueObj.getName() === values[j].value)
                                    continue;
                            }
                            values.push(valueObj.getName());
                        }
                        else if (rel.getName() === constants.AKM_IS_DEFAULTVALUE) {
                            let valueObj = rel.getToObject();
                            datatype.setDefaultValue(valueObj.getName());
                        }
                    }
                }
            }
        }
        for (let i=0; i< values.length; i++) {
            datatype.addAllowedValue(values[i]);
        }
    }
}

export function generateUnit(metamodel, object) {
    let name     = object.getName();
    let descr    = object.getDescription();
    let unit     = metis.findUnitByName(name);
    if (!unit) {
        unit = new akm.cxUnit(utils.createGuid(), name, descr);
        metamodel.addUnit(unit);
        metis.addUnit(unit);
    } else 
        metamodel.addUnit(unit);
}

export function generateTargetMetamodel(targetmetamodel, sourcemodelview) {
    let metamodel = targetmetamodel;
    let modelview = sourcemodelview;
    if (!modelview)
        return false;
    let model = modelview.getModel();  // Concept model
    // Define the metamodel type:s
    // Look up the Task object type and connect it to the metamodel
    let objtype;
    objtype = metis.findObjectTypeByName('Task');
    if (objtype)
        metamodel.addObjectType(objtype);
    // Look up the Role object type and connect it to the metamodel
    objtype = metis.findObjectTypeByName('Role');
    if (objtype)
        metamodel.addObjectType(objtype);
    // Look up the View object type and connect it to the metamodel
    objtype = metis.findObjectTypeByName('View');
    if (objtype)
        metamodel.addObjectType(objtype);
    // Look up the View object type and connect it to the metamodel
    objtype = metis.findObjectTypeByName('Property');
    if (objtype)
        metamodel.addObjectType(objtype);
    // Generate the types defined in the concept model, 
    //  and connect them all to the metamodel:
    // Look up the datatype objects
    let objects;
    objects = model.getObjectsByTypename('Datatype');
    // For each Datatype object call generateDatatype
    if (objects) {
        for (let i=0; i<objects.length; i++) {
            let obj = objects[i];
            if (obj)
                generateDatatype(obj);
        }
    }
    // Look up the Unit objects
    objects = model.getObjectsByTypename('Unit');
    // For each unit object call generateUnit
    if (objects) {
        for (let i=0; i<objects.length; i++) {
            let obj = objects[i];
            if (obj)
                generateUnit(metamodel, obj);
        }
    }
    // Look up the Information objects
    let objectviews = modelview.objectviews;
    for (let i=0; i<objectviews.length; i++) {
        let objview = objectviews[i];
        if (!objview) 
            continue;
        let type = metis.findObjectTypeByName('Information');
        let obj = objview.object;
        if (obj && obj.type) {
            if (obj.type.inherits(type)) {
                generateObjectType(metamodel, obj, objview);
            }
        }
    }
            // For each object call generateObjectType
            // Look up the relationships between Roles and Tasks
                // For each relship, get relship type and add to metamodel
            // Look up the relationships between Tasks and Informations
                // For each relship, get relship type and add to metamodel

    alert("Target metamodel has been successfully generated!");
    return true;
}

export function generateTargetModel(targetModelview, sourceModelview) {
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
        copyObjectview(objview, targetModelview);
    }
    
    /* selection is an array of objectviews to be copied to targetmodelview
    for (let i=0; i<selectionInfo.length; i++) {
        let objview = selectionInfo[i];
        copyObjectview(objview, targetModelview);
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
            copyRelshipview(relview, targetModelview);
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

            toModelview.addRelationshipView(toRelview);
            metis.addRelationshipView(toRelview);
        }
    }
}
