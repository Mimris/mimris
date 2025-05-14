// @ts-nocheck
const debug = false;

import { has } from 'immer/dist/internal';

import * as utils from './utilities';
import * as akm from './metamodeller';
import * as uic from './ui_common';
import * as uid from './ui_diagram';
import * as jsn from './ui_json';
import * as constants from './constants';

const resetTypeIdOnRelship = false;

export function askForMetamodel(context: any, create: boolean) {
    const myMetis = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const metamodels = myMetis.metamodels;

    let mmlist = "";
    for (let i = 0; i < metamodels.length; i++) {
        const mm = metamodels[i];
        if (mm.name === constants.admin.AKM_ADMIN_META)
            continue;
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
        if (!metamodel) {
            if (confirm("Create new metamodel '" + mmname + "' ?")) {
                metamodel = new akm.cxMetaModel(utils.createGuid(), mmname, "");
                myMetis.addMetamodel(metamodel);
            } else {
                alert("Operation was cancelled!");
                return;
            }
        }
        return metamodel;
    }
}

function getObjectSystemTypes(myMetis: akm.cxMetis, includeMeta: boolean): akm.cxObjectType[] {
    const retval: akm.cxObjectType[] = new Array();
    let typenames = new Array();
    if (includeMeta) {
        typenames.push(constants.types.AKM_ELEMENT);
        typenames.push(constants.types.AKM_ENTITY_TYPE);
        typenames.push(constants.types.AKM_GENERIC);
    }
    typenames.push(constants.types.AKM_LABEL);
    typenames.push(constants.types.AKM_CONTAINER);
    for (let i = 0; i < typenames?.length; i++) {
        const typename = typenames[i];
        let objtype = myMetis.findObjectTypeByName(typename);
        if (objtype) {
            retval.push(objtype);
        }
    }
    return retval;
}

function getRelshipSystemTypes(myMetis: akm.cxMetis): akm.cxObjectType[] {
    const retval: akm.cxRelationshipType[] = new Array();
    let typenames = new Array();
    // typenames.push(constants.types.AKM_HAS_PART);
    // typenames.push(constants.types.AKM_HAS_MEMBER);
    typenames.push(constants.types.AKM_REFERS_TO);
    typenames.push(constants.types.AKM_ANNOTATES);
    typenames.push(constants.types.AKM_GENERIC_REL);
    for (let i = 0; i < typenames?.length; i++) {
        const typename = typenames[i];
        let reltype = myMetis.findRelationshipTypeByName(typename);
        if (reltype) {
            retval.push(reltype);
        }
    }
    return retval;
}

function isSystemObjectType(objtype: akm.cxObjectType, includeMetamodelling: boolean) {
    const typename = objtype.name;
    switch (typename) {
        case constants.types.AKM_ELEMENT:
        case constants.types.AKM_ENTITY_TYPE:
        case constants.types.AKM_GENERIC:
        case constants.types.AKM_LABEL:
        case constants.types.AKM_CONTAINER:
            return true;
    }
    if (includeMetamodelling) {
        switch (typename) {
            case constants.types.AKM_PROPERTY:
            case constants.types.AKM_DATATYPE:
            case constants.types.AKM_FIELDTYPE:
            case constants.types.AKM_INPUTPATTERN:
            case constants.types.AKM_VIEWFORMAT:
            case constants.types.AKM_VALUE:
            case constants.types.AKM_UNIT:
            case constants.types.AKM_METHOD:
            case constants.types.AKM_METHODTYPE:
            case constants.types.AKM_METAMODEL:
                return true;
        }
    }
    return false;
}

function getRelationshipSystemTypes(myMetamodel: akm.cxMetaModel, includeMetamodelling: boolean) {
    let retval = new Array();
    const reltypes = myMetamodel.relshiptypes;
    for (let i = 0; i < reltypes.length; i++) {
        const reltype = reltypes[i];
        if (isSystemRelationshipType(reltype, includeMetamodelling))
            retval.push(reltype);
    }
    retval = utils.removeArrayDuplicatesById(retval, "id");
    return retval;
}

function isSystemRelationshipType(reltype: akm.cxRelationshipType, includeMetamodelling: boolean, includeEntityType: boolean) {
    const typename = reltype.name;
    switch (typename) {
        case constants.types.AKM_REFERS_TO:
        case constants.types.AKM_ANNOTATES:
        case constants.types.AKM_GENERIC_REL:
            return true;
    }
    if (includeMetamodelling) {
        switch (typename) {
            case constants.types.AKM_IS:
            case constants.types.AKM_CONTAINS:
            case constants.types.AKM_HAS_SUBMODEL:
            case constants.types.AKM_HAS_SUBMETAMODEL:
            case constants.types.AKM_IS_OF_DATATYPE:
            case constants.types.AKM_IS_DEFAULTVALUE:
            case constants.types.AKM_HAS_PORT:
            case constants.types.AKM_HAS_METHOD:
            case constants.types.AKM_HAS_METHODTYPE:
            case constants.types.AKM_RELATIONSHIP_TYPE:
            case constants.types.AKM_HAS_PROPERTY:
            case constants.types.AKM_HAS_FIELDTYPE:
            case constants.types.AKM_HAS_INPUTPATTERN:
            case constants.types.AKM_HAS_VIEWFORMAT:
            case constants.types.AKM_HAS_VALUE:
            case constants.types.AKM_ANNOTATES:
            // case constants.types.AKM_HAS_MEMBER:
            // case constants.types.AKM_HAS_PART:
                return true;
        }
        // typename === constants.types.AKM_IS
        const totype: akm.cxObjectType = reltype.toObjtype;
        const fromtype: akm.cxObjectType = reltype.fromObjtype;
        if (typename === constants.types.AKM_IS && totype?.name === constants.types.AKM_ELEMENT)
            return true;
        if (typename === constants.types.AKM_IS && fromtype?.name === constants.types.AKM_GENERIC)
            return true;
        if (typename === constants.types.AKM_IS && fromtype?.name === constants.types.AKM_CONTAINER)
            return true;
    }
    return false;
}

function isCoreObjectType(objtype: akm.cxObjectType, isCoreMetamodel: boolean) {
    if (isCoreMetamodel) return false;
    let retval = false;
    const typename = objtype.name;
    switch (typename) {
        case constants.types.AKM_PROPERTY:
        case constants.types.AKM_DATATYPE:
        case constants.types.AKM_FIELDTYPE:
        case constants.types.AKM_INPUTPATTERN:
        case constants.types.AKM_VIEWFORMAT:
        case constants.types.AKM_VALUE:
        case constants.types.AKM_UNIT:
        case constants.types.AKM_METHOD:
        case constants.types.AKM_METHODTYPE:
        case constants.types.AKM_PORT:
        case constants.types.AKM_RELSHIP_TYPE:
        case constants.types.AKM_METAMODEL:
        case constants.types.AKM_MODEL:
            return true;
    }
    return retval;
}

function isCoreRelationshipType(reltype: akm.cxRelationshipType, isCoreMetamodel: boolean) {
    if (isCoreMetamodel) return false;
    let retval = false;
    const typename = reltype.name;
    switch (typename) {
        case constants.types.AKM_CONTAINS:
        case constants.types.AKM_HAS_SUBMODEL:
        case constants.types.AKM_HAS_SUBMETAMODEL:
            return true;
    }
    return retval;
}

function isApplicationRelType(reltype: akm.cxRelationshipType, objtypes: akm.cxObjectType[]): boolean {
    if (!reltype) return false;
    let retval = false;
    const fromObjtype = reltype.fromObjtype;
    if (objtypes.find(o => o.id === fromObjtype?.id)) {
        const toObjtype = reltype.toObjtype;
        if (objtypes.find(o => o.id === toObjtype?.id)) {
            retval = true;
        }
    }
    return retval;
}

export function generateObjectType(object: akm.cxObject, oview: akm.cxObjectView, context: any) {
    if (!object) {
        return;
    }
    const myMetis = context.myMetis;
    const myTargetMetamodel = context.myTargetMetamodel;
    let typid = object.generatedTypeId; // The previously generated type id
    const myModel = context.myModel as akm.cxModel;
    const myModelView = context.myCurrentModelview as akm.cxModelView;
    // 'object' is the object defining the object type to be generated
    const currentObj = myMetis.findObject(object.id) as akm.cxObject;
    let parentRelType: akm.cxRelationshipType | null = null;
    let newName = object.name;
    let oldName = "";
    newName = utils.camelize(newName);
    newName = utils.capitalizeFirstLetter(newName);
    let objname = newName;
    let objtype: akm.cxObjectType;
    if (typid) { // The object type exists - has been generated before
        objtype = myTargetMetamodel.findObjectType(typid);
        if (objtype) {
            oldName = objtype.getName();
            objtype.setName(newName);
            objtype.setDescription(object.description);
            objtype.typeDescription = currentObj.typeDescription;
            // if (objtype.name === constants.types.AKM_ENTITY_TYPE) {
                objtype.attributes = new Array();
                objtype.properties = new Array();
            // }
        }
    } // Check if the type has not been generated, but exists anyway
    if (!objtype) {
        objtype = myTargetMetamodel.findObjectTypeByName(newName);
        if (objtype)
            typid = objtype.getId();
    }
    if (!objtype) { // This is a new object type
        let metaObjectName;
        const metaObjectNames = ['EntityType'];
        for (let i = 0; i < metaObjectNames.length; i++) {
            const mObjectName = metaObjectNames[i];
            const mType = myTargetMetamodel.findObjectTypeByName(mObjectName);
            if (mType) {
                // metaObject exists
                metaObjectName = mObjectName;
                break;
            }
        }
        if (currentObj.type.name === metaObjectName
            || currentObj.isOfSystemType(metaObjectName)
        ) {
            let name = objname;
            if (!typid)
                typid = utils.createGuid();
            objtype = new akm.cxObjectType(typid, name, currentObj.description);
            currentObj.generatedTypeId = typid;
        }
    }
    if (!objtype) { // The type generation failed
        return null;
    }
    if (objtype) { // The type has been generated - fullfill the generation
        let viewkind = currentObj.getViewKind();
        let objview: cxObjectView;  
        if (currentObj.objectviews) 
            objview = currentObj.objectviews[0];
        if (!objview)
            return;
        if (currentObj.name === "SwimPool") {
            viewkind = "Container";
            objview.template = "SwimPool";
        } else if (objview && currentObj.name === "SwimLane") {
            viewkind = "Container";
            objview.template = "SwimLane";
        } else if (objview.isGroup) {
            viewkind = "Container";
        } else {
            viewkind = currentObj.getViewKind();
        }
        if (objview.template2) {
            objview.template = objview.template2;
        }

        objview.viewkind = viewkind;
        object.viewkind = viewkind;
        object.generatedTypeId = objtype.getId();
        objtype.setViewKind(viewkind);
        objtype.setAbstract(currentObj.getAbstract());
        objtype.setModified();
        objtype.markedAsDeleted = object.markedAsDeleted;
        { // Handle local inheritance
            const inheritanceObjects = currentObj.getInheritanceObjects(myModel);
            for (let i = 0; i < inheritanceObjects.length; i++) {
                const inhObj = inheritanceObjects[i];
                const inhObjType = myMetis.findObjectType(inhObj.generatedTypeId);
                if (inhObjType) {
                    let parentRelType = myTargetMetamodel.findRelationshipTypeByName2(constants.types.AKM_IS, objtype, inhObjType);
                    if (!parentRelType) {
                        // Create 'Is' relationship type
                        parentRelType = new akm.cxRelationshipType(utils.createGuid(), constants.types.AKM_IS, objtype, inhObjType, "");
                        objtype.addOutputreltype(parentRelType);
                        inhObjType.addInputreltype(parentRelType);
                        parentRelType.setModified();
                        parentRelType.setRelshipKind('Generalization');
                        myTargetMetamodel.addRelationshipType(parentRelType);
                        myMetis.addRelationshipType(parentRelType);
                    }
                }
            }
        }
        { // Handle special attributes
            objtype.abstract = currentObj.abstract;
        }
        myTargetMetamodel?.addObjectType(objtype);
        myMetis.addObjectType(objtype);
        object.generatedTypeId = objtype.getId();
        { // Handle objecttypeview
            let objtypeview = objtype.typeview;
            let id;
            if (objtypeview)
                id = objtypeview.id;
            if (!objtypeview) 
                id = utils.createGuid();
            objtypeview = new akm.cxObjectTypeView(id, objtype.name, objtype, currentObj.description);
            objtypeview.applyObjectViewParameters(objview);
            objtype.typeview = objtypeview;
            objtypeview.viewkind = viewkind;
            objtype.setModified();
            myTargetMetamodel.addObjectTypeView(objtypeview);
            myMetis.addObjectTypeView(objtypeview);
            // Do the dispatch
            const jsnObjTypeview = new jsn.jsnObjectTypeView(objtypeview);
            context.dispatch({ type: 'UPDATE_OBJTYPEVIEW_PROPERTIES', data: jsnObjTypeview });
        }
    }
    { // Handle relationship to parent ('Is' relationship)
        let parentType: akm.cxObjectType | null = null;
        if (objtype) {
            objtype.setModified();
            if (!parentType) {
                parentType = currentObj.type as akm.cxObjectType;
                if (parentType) {
                    parentType = myTargetMetamodel.findObjectTypeByName(parentType.name);
                }
            }
            // Connect objtype to parentType
            // First check if it already exists
            if (!parentRelType)
                parentRelType = myTargetMetamodel.findRelationshipTypeByName2(constants.types.AKM_IS, objtype, parentType);
            if (!parentRelType) {
                // It does not exist, so create it
                parentRelType = new akm.cxRelationshipType(utils.createGuid(), constants.types.AKM_IS, objtype, parentType, "");
                objtype.addOutputreltype(parentRelType);
                parentType.addInputreltype(parentRelType);
                parentRelType.setModified();
                parentRelType.setRelshipKind('Generalization');
                myTargetMetamodel.addRelationshipType(parentRelType);
                myMetis.addRelationshipType(parentRelType);
                const jsnRelType = new jsn.jsnRelationshipType(parentRelType);
                context.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data: jsnRelType });
            }
        }
    }
    { // Handle methods
        const baseObject = 'EntityType';
        const basetype = myMetis.findObjectTypeByName(baseObject);
        const mtdtype = myMetis.findObjectTypeByName(constants.types.AKM_METHOD);
        const reltype = myMetis.findRelationshipTypeByName2(constants.types.AKM_HAS_METHOD, basetype, mtdtype);
        const methods = [];
        const rels = currentObj.outputrels;
        for (let i = 0; i < rels?.length; i++) {
            const rel = rels[i];
            if (rel?.type?.id === reltype?.id) {
                const mtdobj = rel.toObject;
                if (mtdobj) {
                    // Find corresponding method
                    const mtd = myTargetMetamodel.findMethodByName(mtdobj.name);
                    if (mtd) methods.push(mtd);
                }
            }
        }
        objtype.methods = methods;
    }
    { // Handle properties and attributes
        let typeprops: akm.cxProperty[] = new Array();
        // const typeprops = objtype.properties;
        typeprops = getAllPropertytypes(currentObj, typeprops, myModel);
        addProperties(objtype, typeprops, context);
    }
    { // Handle ports
        const porttype = myMetis.findObjectTypeByName(constants.types.AKM_PORT);
        const ports = new Array();
        const rels = object.outputrels;
        for (let i = 0; i < rels?.length; i++) {
            const rel = rels[i];
            if (rel?.type?.name === constants.types.AKM_HAS_PORT) {
                const port = rel.toObject as akm.cxObject;
                if (port) {
                    const portviews = myModelView.findObjectViewsByObj(port);
                    if (portviews?.length > 0) {
                        const portview = portviews[0];
                        if (portview)
                            port.color = portview.fillcolor;
                        port.type = porttype;
                    }
                    ports.push(port);
                }
            }
        }
        if (ports) objtype.ports = ports;
    }
    // Dispatch the object
    const jsnObject = new jsn.jsnObject(object);
    context.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: jsnObject });

    return objtype;
}

export function generateRelshipType(relship: akm.cxRelationship, relview: akm.cxRelationshipView, context: any) {
    if (!relship) {
        return;
    }
    const myMetis:akm.cxMetis = context.myMetis;
    const myDiagram = context.myDiagram;
    const myTargetMetamodel: akm.cxMetamodel = context.myTargetMetamodel;
    const myModel = context.myModel as akm.cxModel;
    const myModelView = context.myCurrentModelview as akm.cxModelView;
    // relship is the relationship defining the relationship type to be generated
    const currentRel = myMetis.findRelationship(relship.id);
    // fromName is the relationship type name seen from the from object
    // toName is the relationship type name seen from the to object
    const names = currentRel?.name.split("/");
    let fromName = names ? names[0] : currentRel?.name;
    let toName = "";
    if (names?.length > 0) {
        toName = names[1];
    }
    const fromObj = currentRel?.getFromObject();
    let fromObjName = fromObj?.name;
    fromObjName = utils.camelize(fromObjName);
    fromObjName = utils.capitalizeFirstLetter(fromObjName);
    const fromtype = myTargetMetamodel?.findObjectTypeByName(fromObjName);
    const toObj = currentRel?.getToObject();
    let toObjName = toObj?.name;
    toObjName = utils.camelize(toObjName);
    toObjName = utils.capitalizeFirstLetter(toObjName);
    const totype = myTargetMetamodel?.findObjectTypeByName(toObjName);
    // let newName  = currentRel?.getName();
    let newName = fromName;
    if (toName?.length > 0) newName = newName + "/" + toName;
    let oldName = "";
    // newName = utils.camelize(newName);
    // if (newName !== constants.types.AKM_IS)
    //     newName = utils.uncapitalizeFirstLetter(newName);
    let relname = newName;
    let reltype: akm.cxRelationshipType;
    let reltypeview: akm.cxRelationshipTypeView;
    let typeid: string;

    if (resetTypeIdOnRelship) 
        typeid = "";
    else
        typeid = currentRel?.generatedTypeId;
    if (!typeid)
        typeid = utils.createGuid();
    if (typeid) // The type has been generated before
    {
        reltype = myMetis.findRelationshipType(typeid);  // The existing relationship type
        if (reltype) {
            // Eventually do a rename
            oldName = reltype?.getName();
            reltype.setName(newName);

            // The following code fails due to that fromType and toType for some reason are unknown / undefined   
            if (false) {
                // Ensure that the reltype has the same from and to object types
                let fromType = reltype.fromObjtype;
                let toType = reltype.toObjtype;
                fromType = myMetis.findObjectType(fromType?.id);
                if (fromType) {
                    toType = myMetis.findObjectType(toType?.id);
                    if (!toType)
                        reltype = null;
                } else
                    reltype = null;
            }
            // End failing code             
        }
        if (reltype) {
            reltype.markedAsDeleted = relship.markedAsDeleted;
            myTargetMetamodel?.addRelationshipType(reltype);
        }
    } else if (!resetTypeIdOnRelship) // Check if the type has not been generated, but exists anyway
    {
        reltype = myMetis.findRelationshipTypeByName2(relname, fromtype, totype);
        if (reltype) {
            reltype.markedAsDeleted = relship.markedAsDeleted;
            myTargetMetamodel?.addRelationshipType(reltype);
            reltype.relshipkind = relship.relshipkind;
            reltype.cardinality = relship.cardinality;
        }
    }
    if (!reltype) {  // This is a new relationship type
        if (relname && fromtype && totype) {
            reltype = new akm.cxRelationshipType(typeid, relname, fromtype, totype, currentRel.description);
            if (reltype) {
                const names = relname.split("/");
                if (names.length > 1) {
                    reltype.nameFrom = names[0];
                    reltype.nameTo = names[1];
                }
                { // Handle special attributes
                    reltype.relshipkind = relship.relshipkind;
                    reltype.cardinality = relship.cardinality;
                }
            }
        }
    }
    if (reltype) {
        { // Handle the properties
            let props = currentRel?.type?.getProperties(false);
            if (props !== undefined && props !== null && props.length > 0)
                reltype.properties = props;
            else
                reltype.properties = new Array();
            let properties = new Array();
            for (let i = 0; i < props?.length; i++) {
                const prop = props[i];
                properties?.push(prop);
            }
            reltype.properties = properties;
        }
        myTargetMetamodel?.addRelationshipType(reltype);
        myMetis.addRelationshipType(reltype);
        if (currentRel) {
            let relview = currentRel.relshipviews[0];
            if (relview.template2) {
                relview.template = relview.template2;
            }
            currentRel.generatedTypeId = reltype.id;
            myModel.addRelationship(currentRel);
            myMetis.addRelationship(currentRel);
        }

        // Create/Modify the relationship typeview
        reltypeview = reltype.typeview;
        if (!reltypeview) {
            const guid = utils.createGuid();
            const name = reltype.name + '_' + reltype.getRelshipKind();
            reltypeview = new akm.cxRelationshipTypeView(guid, name, reltype, "");
        }
        reltypeview.applyRelationshipViewParameters(relview);
        reltypeview.setRelshipKind(reltype.relshipkind);
        reltype.typeview = reltypeview;
        reltype.setModified();
        myTargetMetamodel?.addRelationshipTypeView(reltypeview);
        myMetis.addRelationshipTypeView(reltypeview);
    }
    return reltype;
}

export function generateRelshipType2(object: akm.cxObject, fromType: akm.cxObjectType, toType: akm.cxObjectType, context: any) {
    if (!object) {
        return;
    }
    const myDiagram = context.myDiagram;
    const myMetis = context.myMetis;
    const myTargetMetamodel = context.myTargetMetamodel;
    const myModel = context.myModel;
    const modifiedRelshipTypes = new Array();

    const relname = object.name;
    let reltype: akm.cxRelationshipType | null = null;
    if (relname === constants.types.AKM_RELATIONSHIP_TYPE) {
        const fromType = myMetis.findObjectTypeByName(constants.types.AKM_ENTITY_TYPE);
        const toType = fromType;
        reltype = myMetis.findRelationshipTypeByName2(relname, fromType, toType);
        reltype.properties = new Array();
    } else {
        // Check if reltype exists in myMetis
        reltype = myMetis.findRelationshipTypeByName2(relname, fromType, toType);
        if (!reltype)
            reltype = new akm.cxRelationshipType(utils.createGuid(), relname, fromType, toType, object.description);
    }
    myTargetMetamodel?.addRelationshipType(reltype);
    myMetis.addRelationshipType(reltype);

    { // Handle properties
        const typeprops: akm.cxProperty[] = new Array();
        getAllPropertytypes(object, typeprops, myModel);
        addProperties(reltype, typeprops, context);
    }
    { // Handle the relationship typeview
        let reltypeview = reltype.typeview;
        if (!reltypeview) {
            const guid = utils.createGuid();
            const name = reltype.name + '_' + reltype.getRelshipKind();
            reltypeview = new akm.cxRelationshipTypeView(guid, name, reltype, "");
        }
        reltype.typeview = reltypeview;
        myTargetMetamodel?.addRelationshipTypeView(reltypeview);
        myMetis.addRelationshipTypeView(reltypeview);
        reltype.setModified();
    }
    return reltype;
}

export function generateDatatype(obj: akm.cxObject, context: any) {
    const myMetis: akm.cxMetis = context.myMetis;
    const myModel: akm.cxModel = context.myModel;
    const myDiagram = context.myDiagram;
    const object = myMetis.findObject(obj.id);
    let name = object.name;
    const descr = object.description;
    const myTargetMetamodel: akm.cxMetaModel = context.myTargetMetamodel;
    if (!myTargetMetamodel)
        return null;
    let datatype = myTargetMetamodel?.findDatatypeByName(name);
    if (!datatype) {
        const dtype = myMetis.findDatatypeByName(name);
        if (dtype) {
            // Datatype exists
            myTargetMetamodel.addDatatype(dtype);
        } else {
            // Create a new datatype
            datatype = new akm.cxDatatype(utils.createGuid(), name, descr);
            myTargetMetamodel.addDatatype(datatype);
            myMetis.addDatatype(datatype);
        }
    }
    if (datatype) {
        // Handle all aspects of the datatype
        const rels = object.getOutputRelships(myModel, constants.relkinds.REL);
        if (rels) {
            let values: string[] = new Array();
            // Check if it has a parent datatype
            for (let i = 0; i < rels.length; i++) {
                const rel = rels[i];
                const parentObj = rel.toObject;
                const parentType = parentObj.type;
                if (parentType.name === constants.types.AKM_DATATYPE) {
                    let parentDtype = myMetis.findDatatypeByName(parentObj.name);
                    datatype.setIsOfDatatype(parentDtype);
                    // Copy default values from parentDtype
                    datatype.setInputPattern(parentDtype?.inputPattern);
                    datatype.setViewFormat(parentDtype?.viewFormat);
                    datatype.setFieldType(parentDtype?.fieldType);
                }
            }
            // Find allowed values if any
            for (let i = 0; i < rels.length; i++) {
                let rel = rels[i];
                if (rel.name === constants.types.AKM_HAS_ALLOWED_VALUE) {
                    let valueObj = rel.toObject;
                    // Check if allowed value already exists
                    for (let j = 0; j < values.length; j++) {
                        if (valueObj.name === values[j].value)
                            continue;
                    }
                    values.push(valueObj.name);
                }
                else if (rel.getName() === constants.types.AKM_IS_DEFAULTVALUE) {
                    let valueObj = rel.toObject;
                    if (valueObj) {
                        datatype.setDefaultValue(valueObj.name);
                        values.push(valueObj.name);
                    }
                }
                for (let i = 0; i < values.length; i++) {
                    datatype.addAllowedValue(values[i]);
                }
                if (values.length > 0) {
                    if (datatype.getFieldType() === 'text')
                        datatype.setFieldType('radio');
                }
            }
            for (let i = 0; i < rels.length; i++) {
                let rel = rels[i];
                // Handle datatype reference
                if (rel.getName() === constants.types.AKM_IS_OF_DATATYPE) {
                    const toObj = rel.getToObject();
                    if (toObj.type.name === constants.types.AKM_DATATYPE) {
                        let dtypeObj = toObj;
                        let dtype = myMetis.findDatatypeByName(dtypeObj.name);
                        if (dtype) {
                            datatype.setIsOfDatatype(dtype);
                        }
                    }
                }
                // Handle input pattern
                if (rel.getName() === constants.types.AKM_HAS_INPUTPATTERN) {
                    const toObj = rel.getToObject();
                    if (toObj.type.name === constants.types.AKM_INPUTPATTERN) {
                        let valueObj = toObj;
                        if (valueObj.pattern)
                            datatype.setInputPattern(valueObj.pattern);
                    }
                }
                // Handle view format
                if (rel.getName() === constants.types.AKM_HAS_VIEWFORMAT) {
                    const toObj = rel.getToObject();
                    if (toObj.type.name === constants.types.AKM_VIEWFORMAT) {
                        let valueObj = toObj;
                        if (valueObj.viewFormat)
                            datatype.setViewFormat(valueObj.viewFormat);
                    }
                }
                // Handle field type
                if (rel.getName() === constants.types.AKM_HAS_FIELDTYPE) {
                    const toObj = rel.getToObject();
                    if (toObj.type.name === constants.types.AKM_FIELDTYPE) {
                        let valueObj = toObj;
                        if (valueObj.name)
                            datatype.setFieldType(valueObj.name);
                    }
                }
                // Add the datatype
                myTargetMetamodel.addDatatype(datatype);
            }
            return datatype;
        }
    }
}

// export function generatePointerDatatype(object: akm.cxObject, context: any) {
//     // object is a pointer datatype
//     const myMetis  = context.myMetis;
//     const myModel  = context.myModel;
//     const myTargetMetamodel = context.myTargetMetamodel;
//     const rels = object.getOutputRelships(myModel, constants.relkinds.REL);
//     for (let i=0; i<rels?.length; i++) {
//         let rel = rels[i];
//         if (rel.getName() === constants.types.AKM_POINTS_TO) {
//             const toObj = rel.getToObject();
//             if (toObj.type.name === constants.types.AKM_ENTITY_TYPE) {
//                 const datatype = new akm.cxDatatype(utils.createGuid(), object.name, "");
//                 datatype.setPointerType(toObj.type);
//                 myTargetMetamodel.addDatatype(datatype);
//             }
//         }
//     }
// }

export function generateMethodType(obj: akm.cxObject, context: any): akm.cxMethodType {
    const myMetis = context.myMetis;
    const myModel = context.myModel;
    const object = myMetis.findObject(obj.id);
    const name = object.name;
    const descr = object.description;
    const myTargetMetamodel = context.myTargetMetamodel;
    if (!myTargetMetamodel)
        return null;
    let mtdtype = myTargetMetamodel?.findMethodTypeByName(name);
    if (!mtdtype) {
        mtdtype = new akm.cxMethodType(utils.createGuid(), name, descr);
        myTargetMetamodel.addMethodType(mtdtype);
        myMetis.addMethodType(mtdtype);
    } else {
        mtdtype.properties = new Array();
    }
    if (mtdtype) {
        // Handle properties
        const typeprops: akm.cxProperty[] = new Array();
        getAllPropertytypes(obj, typeprops, myModel);
        addProperties(mtdtype, typeprops, context);
        return mtdtype;
    }
}

export function generateMethod(obj: akm.cxObject, context: any): akm.cxMethod {
    const myMetis = context.myMetis;
    const myModel = context.myModel;
    const myDiagram = context.myDiagram;
    const object = myMetis.findObject(obj.id);
    const name = object.name;
    const descr = object.description;
    const myMetamodel = context.myMetamodel;
    const myTargetMetamodel = context.myTargetMetamodel;
    // let method   = myMetamodel?.findMethodByName(name);
    let method = myTargetMetamodel?.findMethodByName(name);
    if (!method) {
        method = myMetis.findMethodByName(name);
        if (!method)
            method = new akm.cxMethod(utils.createGuid(), name, descr);
        // myMetamodel.addMethod(method);
        myTargetMetamodel.addMethod(method);
        myMetis.addMethod(method);
    }
    const mtdtypename = object.methodtype;
    const methodType = myMetamodel.findMethodTypeByName(mtdtypename);
    if (method && methodType) {
        method.methodtype = methodType.name;
        const props = methodType.properties;
        for (let i = 0; i < props?.length; i++) {
            const propname = props[i].name;
            method[propname] = object[propname];
        }
    }
    return method;
}

export function generateUnit(object: akm.cxObject, context: any) {
    const myMetis = context.myMetis;
    const myMetamodel = context.myMetamodel;
    let name = object.name;
    let descr = object.description;
    let unit = myMetis.findUnitByName(name);
    if (!unit) {
        unit = new akm.cxUnit(utils.createGuid(), name, descr);
        myMetamodel.addUnit(unit);
        myMetis.addUnit(unit);
    } else
        myMetamodel.addUnit(unit);
    return unit;
}

function getMetamodelObject(nodes: any, containsType: akm.cxRelationshipType, myMetis: akm.cxMetis): akm.cxObject {
    let retval: akm.cxObject = null;
    for (let it = nodes.iterator; it?.next();) {
        const node = it.value;
        let obj = node.data.object;
        if (obj?.type.name === constants.types.AKM_METAMODEL) {
            obj = myMetis.findObject(obj.id);
            let rels = obj?.getOutputRelshipsByType(containsType);
            if (rels?.length > 0) {
                retval = obj;
                break;
            }

        }
    }
    return retval;
}

export function generateTargetMetamodel(obj: any, myMetis: akm.cxMetis, myDiagram: any) {
    const nodes = myDiagram.nodes;
    let mmObjectView: akm.cxObjectView;
    let targetMetamodel: akm.cxMetaModel;
    const mmType = myMetis.findObjectTypeByName(constants.types.AKM_METAMODEL);
    const entType = myMetis.findObjectTypeByName(constants.types.AKM_ENTITY_TYPE);
    const containsType = myMetis.findRelationshipTypeByName1(constants.types.AKM_CONTAINS, mmType, entType);
    let mmname = "";
    for (let it = nodes.iterator; it?.next();) {
        const modifiedMetamodels = new Array();
        const node = it.value;
        if (node.name === obj.name) {
            const object = node.data.object;
            const objectview = node.data.objectview;
            const mmObject = getMetamodelObject(nodes, containsType, myMetis);
            if (!mmObject)
                continue;
            mmname = mmObject.name;
            targetMetamodel = myMetis.findMetamodelByName(mmname);
            if (!targetMetamodel) {
                targetMetamodel = new akm.cxMetaModel(utils.createGuid(), mmname, object.description);
                myMetis.addMetamodel(targetMetamodel);
            }
            mmObjectView = myMetis.currentModelview.findObjectViewByName(mmObject.name);
            let obj1 = mmObjectView.object
            obj1 = myMetis.findObject(obj1.id);
            mmObjectView.object = obj1;
            break;
        }
    }
    if (mmname === constants.core.AKM_CORE_META) {
        myMetis.currentModel.includeSystemtypes = true;
    } else {
        myMetis.currentModel.includeSystemtypes = false;
    }
    const args = {
        "metamodel": myMetis.currentTargetMetamodel,
        "modelview": myMetis.currentModelview,
        "node": myMetis.currentNode,
    }
    const context = {
        "myMetis": myMetis,
        "myMetamodel": myMetis.currentMetamodel,
        "myModel": myMetis.currentModel,
        "myGoModel": myMetis.gojsModel,
        "myCurrentModelview": myMetis.currentModelview,
        "myCurrentObjectview": mmObjectView,
        "myDiagram": myDiagram,
        "case": "Generate Target Metamodel",
        "title": "Select Target Metamodel",
        "dispatch": myDiagram.dispatch,
        "postOperation": generateTargetMetamodel2,
        "args": args
    }
    askForTargetMetamodel(context);
}

export function askForTargetMetamodel(context: any) {
    const myMetis: akm.cxMetis = context.myMetis;
    const myMetamodel: akm.cxMetamodel = context.myMetamodel;
    const myModelview: akm.cxModelview = context.myMetis.currentModelview;
    const myDiagram = context.myDiagram;
    const modalContext = {
        what: "selectDropdown",
        title: context.title,
        case: context.case,
        modelview: myModelview,
        myDiagram: myDiagram,
        context: context,
    }
    let mmlist = [];
    const objectviews = myModelview.objectviews;
    for (let i = 0; i < objectviews?.length; i++) {
        const objectview = objectviews[i] as akm.cxObjectView;
        if (!objectview) 
            continue;
        let object = objectview.object as akm.cxObject;
        if (!object) {
            const objId = objectview.objectRef;
            if (objId)
                object = myMetis.getObject(objId);
        }
        if (object?.type?.name === constants.types.AKM_METAMODEL) {
            const relviews = objectview.getInputRelviews();
            for (let j = 0; j < relviews?.length; j++) {
                const relview = relviews[j];
                const rel = relview.relship;
                if (rel?.type?.name === constants.types.AKM_CONTAINS) {
                    const fromObj = rel.fromObject;
                    if (fromObj.type.name === constants.types.AKM_METAMODEL) {
                        if (mmlist == null || mmlist.length == 0) {
                            mmlist.push(fromObj.name);
                        }
                    }
                    break;
                }
            }
            if (mmlist == null || mmlist.length == 0) {
                mmlist.push(object.name);
            } else {
                let uniqueSet = utils.removeArrayDuplicates(mmlist);
                mmlist = uniqueSet;
            }
        }
    }
    if (mmlist == null || mmlist.length == 0) {
        const metamodels = myMetis.metamodels;
        for (let i = 0; i < metamodels.length; i++) {
            const mm = metamodels[i];
            if (!mm.id)
                continue;
            if (mm.name === constants.admin.AKM_ADMIN_META)
                continue;
            if (!myMetis.allowGenerateCurrentMetamodel) {
                if (mm.id === myMetamodel.id)
                    continue;
            }
            mmlist.push(mm.nameId);
        }
    }
    myDiagram.handleOpenModal(mmlist, modalContext);
}

function clearGivenEntityTypes(typeNames: string[], myMetis: akm.cxMetis) {
    for (let i = 0; i < typeNames.length; i++) {
        const type = myMetis.findObjectTypeByName(typeNames[i]);
        if (type) {
            type.attributes = new Array();
            type.properties = new Array();
        }
    }
}

export function generateTargetMetamodel2(context: any) { // postoperation
    let modelviewList = []; // constants.core.AKM_MODELVIEWS; // [];
    const myDiagram = context.myDiagram;
    const myMetis: akm.cxMetis = context.myMetis;
    const myCurrentObjectview = context.myCurrentObjectview;
    const myCurrentObject = myCurrentObjectview.object;
    // let sourcemodelview = buildTemporaryModelView(context);
    let sourcemodelview = context.myCurrentModelview;
    const args = context.args;
    let targetMetamodel: akm.cxMetaModel = context.myTargetMetamodel;
    if (!targetMetamodel)
        return false;
    if (!sourcemodelview)
        return false;
    if (targetMetamodel.name === constants.core.AKM_CORE_META) {
        const typelist = new Array();
        typelist.push("Default");
        typelist.push("Entity Type");
        typelist.push("$Type");
        clearGivenEntityTypes(typelist, myMetis);
    } else {
        targetMetamodel = myMetis.findMetamodel(targetMetamodel.id);
        targetMetamodel?.clearContent();
    }
    if (targetMetamodel?.name !== constants.core.AKM_CORE_META) {
        modelviewList = new Array();
        modelviewList.push(sourcemodelview.name);
    } else {
        modelviewList = constants.core.AKM_MODELVIEWS;
    }
    // Now go through the modelviewList and execute 'generate metamodel' for each modelview
    let sourcemodel = context.myModel;
    for (let i = 0; i < modelviewList.length; i++) {
        let metamodelObj: akm.cxObject = null;
        const srcmodelview = sourcemodel.findModelViewByName(modelviewList[i]);
        if (srcmodelview) {
            // First find the metamodel object in this modelview
            let mmType = myMetis.findObjectTypeByName(constants.types.AKM_METAMODEL);
            const objectviews = srcmodelview.objectviews;
            for (let i = 0; i < objectviews.length; i++) {
                const objectview = objectviews[i];
                if (objectview?.object?.type?.name === constants.types.AKM_METAMODEL) {
                    if (myCurrentObjectview.id === objectview.id) {
                        metamodelObj = objectview.object;
                        break;
                    }
                }
            }
            // Then find and embed contained metamodels
            const entType = myMetis.findObjectTypeByName(constants.types.AKM_ENTITY_TYPE);
            const containsType = myMetis.findRelationshipTypeByName1(constants.types.AKM_CONTAINS, mmType, entType);
            const containedMetamodels = getContainedMetamodels(myMetis, myCurrentObjectview, containsType);
            for (let i = 0; i < containedMetamodels.length; i++) {
                const metamodel = containedMetamodels[i];
                if (metamodel) {
                    targetMetamodel.addMetamodelContent(metamodel);
                }
            }
            // Then get no of EntityType objects in the srcmodelview
            let noOfEntityTypes = 0;
            let objviews = new Array();
            for (let i = 0; i < objectviews.length; i++) {
                const objectview = objectviews[i];
                if (objectview?.object?.type?.name === constants.types.AKM_ENTITY_TYPE) {
                    objviews.push(objectview);
                    noOfEntityTypes++;
                }
            }
            let objects: akm.cxObject = new Array();
            // Get the object types (objects) contained in this modelview
            let relships = metamodelObj?.getOutputRelships(context.myModel, constants.relkinds.REL);
            for (let j = 0; j < relships?.length; j++) {
                let rel = relships[j];
                if (rel?.type?.name === constants.types.AKM_CONTAINS) {
                    let toObj = rel.toObject;
                    if (toObj.type.name === constants.types.AKM_ENTITY_TYPE) {
                        objects.push(toObj);
                    }
                }
            }
            if (noOfEntityTypes > objects.length) {
                if (!confirm("The number of EntityType objects in the metamodel is less than in the modelview. Continue?"))
                    return false;
            }
            //
            // Get the relevant objectviews and relshipviews
            for (let i = 0; i < objviews.length; i++) {
                const objectview = objviews[i];
                const object: akm.cxObject = objectview.object;
                if (!object) continue;
                if (!object.type) continue;
                if (object.type?.name === constants.types.AKM_METAMODEL) {
                    // Follow 'contains' relationships
                    let rels = object.getOutputRelships(context.myModel, constants.relkinds.REL);
                    for (let j = 0; j < relships?.length; j++) {
                        let rel = rels[j];
                        if (rel?.type?.name === constants.types.AKM_CONTAINS) {
                            let toObj = rel.toObject;
                            if (toObj.type.name === constants.types.AKM_ENTITY_TYPE) {
                                objects.push(toObj);
                            }
                        }
                    }
                    if (noOfEntityTypes > objects.length) {
                        if (!confirm("The number of EntityType objects in the metamodel is less than in the modelview. Continue?"))
                            return false;
                    }
                }
                if (object.type.name === constants.types.AKM_RELSHIP_TYPE) {
                    objects.push(object);
                }
            }
            let relshipviews: akm.cxRelationshipView[] = srcmodelview.relshipviews;
            for (let i=0; i<relshipviews.length; i++) {
                const relview = relshipviews[i];
                const rel = relview?.relship;
                relships?.push(rel);
            }
            // Remove duplicates
            relships = [... new Set(relships)];
            for (let i = 0; i <= objects?.length; i++) {
                const obj = objects[i];
                // if (!objview /*|| objview.markedAsDeleted*/)
                //     continue;
                // let obj = objview.object;
                if (!obj /*|| obj.markedAsDeleted*/)
                    continue;
                if (myCurrentObject.isOfType('Metamodel')) {
                    const fromType = myCurrentObject.type;
                    let toType = myMetis.findObjectTypeByName(constants.types.AKM_METAMODEL);
                    // Follow 'hasSubMetamodel' relationships
                    let hasSubMetamodelType = myMetis.findRelationshipTypeByName1(constants.types.AKM_HAS_SUBMETAMODEL, fromType, toType);
                    const submetaObjects = getSubMetaModelObjects(myCurrentObject, hasSubMetamodelType);
                    for (let i = 0; i < submetaObjects?.length; i++) {
                        const submetaObject = submetaObjects[i];
                        if (submetaObject) {
                            const metamodel = myMetis.findMetamodelByName(submetaObject.name);
                            if (metamodel) {
                                targetMetamodel.addSubMetamodel(metamodel);
                            }
                        }
                    }
                    // Follow 'hasSubModel' relationships
                    toType = myMetis.findObjectTypeByName(constants.types.AKM_MODEL);
                    const hasSubmodelType = myMetis.findRelationshipTypeByName1(constants.types.AKM_HAS_SUBMODEL, fromType, toType);
                    const submodelObjects = getSubModelObjects(obj, hasSubmodelType);
                    for (let i = 0; i < submodelObjects?.length; i++) {
                        const submodelObject = submodelObjects[i];
                        if (submodelObject) {
                            let model = myMetis.findModelByName(submodelObject.name);
                            if (!model) {
                                model = new akm.cxModel(utils.createGuid(), submodelObject.name, submodelObject.description);
                                myMetis.addModel(model);
                            }
                        }
                    }
                }
            }
            // Generate the target metamodel
            context.myTargetMetamodel = targetMetamodel;
            context.firstTime = true;
            targetMetamodel = generateMetamodel(objects, relships, context);
            console.log('1021 Target metamodel: ', targetMetamodel);
        }
        if (srcmodelview)
            console.log('1024 sourcemodelview has been generated: ' + srcmodelview.name);
    }
    // Check if there already exists models based on the generated metamodel
    // const models = myMetis.getModelsByMetamodel()
    alert("The metamodel " + targetMetamodel.name + " has been successfully generated!");
    // const myObject = context.myCurrentObjectview.object;
    // uid.addSubModels(myObject, myMetis, context.myDiagram);
    uic.repairEntityType(myMetis, targetMetamodel, myDiagram);
    uic.repairContainsTypeview(myMetis, null, myDiagram);

    // Dispatch
    const jsnMetamodel = new jsn.jsnMetaModel(targetMetamodel, true);
    myDiagram.dispatch({ type: 'UPDATE_TARGETMETAMODEL_PROPERTIES', data: jsnMetamodel });

    return true;
}

function fulfillRelshipviews(relshipviews: akm.cxRelationshipView[], sourcemodelview: akm.cxModelView, context: any) {
    const myMetis = context.myMetis;
    const myDiagram = context.myDiagram;
    const myModel = context.myModel;
    const myMetamodel = context.myMetamodel;
    const myTargetMetamodel = context.myTargetMetamodel;
    const modifiedRelshipViews = new Array();
    for (let i = 0; i < relshipviews.length; i++) {
        const relshipview = relshipviews[i];
        let fromObjview: akm.cxRelationshipView = relshipview.fromObjview;
        fromObjview = sourcemodelview.findObjectView(fromObjview.id);
        let toObjview: akm.cxRelationshipView = relshipview.toObjview;
        toObjview = sourcemodelview.findObjectView(toObjview.id);
        relshipview.fromObjview = fromObjview;
        relshipview.toObjview = toObjview;
    }
}

export function verifyPortsModel(objectviews: akm.cxObjectView[], relshipviews: akm.cxRelationshipView[]): boolean {
    for (let i = 0; i < objectviews.length; i++) {
        const objview = objectviews[i];
        const obj = objview.object;
        // Check if object is of type "EntityType"
        // Get object view
        // Get the template property
        // Check if template property has a valid value, i.e. "nodeWithPorts" or "groupWithPorts"
        // If not, continue to next objectview
        // Get connected Port objects
        // For each port object, get the side property
        // Check if side property has a valid value
        // If not, alert user and continue to next objectview
        // When all ports have been checked, continue to next objectview
        // When done, return true

        if (ports?.length) {
            for (let j = 0; j < ports.length; j++) {
                const port = ports[j];
                const portname = port.name;
                const porttype = port.porttype;
                const portobj = obj.findPortObject(portname);
                if (!portobj) {
                    alert(`Port ${portname} is missing from object ${obj.name}`);
                    return false;
                }
                if (porttype) {
                    const portobjtype = portobj.objecttype;
                    if (portobjtype.name !== porttype.name) {
                        alert(`Port ${portname} has wrong type ${portobjtype.name} in object ${obj.name}`);
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

function addSubAndContainTypes(myMetis: akm.cxMetis, myMetamodel: akm.cxMetaModel,) {
    const modifiedMetamodels = new Array();
    const modifiedRelTypeViews = new Array();
    const mmType = myMetis.findObjectTypeByName(constants.types.AKM_METAMODEL);
    const mType = myMetis.findObjectTypeByName(constants.types.AKM_MODEL);
    const entType = myMetis.findObjectTypeByName(constants.types.AKM_ENTITY_TYPE);
    let containsType = myMetis.findRelationshipTypeByName1(constants.types.AKM_CONTAINS, mmType, entType);
    if (containsType) {
        const reltypeview = containsType.typeview;
        myMetamodel.addRelationshipTypeView(reltypeview);
    }
    let hasSubType = myMetis.findRelationshipTypeByName1(constants.types.AKM_CONTAINS, mmType, mmType);
    if (hasSubType) {
        const reltypeview = hasSubType.typeview;
        myMetamodel.addRelationshipTypeView(reltypeview);
    }
    hasSubType = myMetis.findRelationshipTypeByName1(constants.types.AKM_CONTAINS, mmType, mType);
    if (hasSubType) {
        const reltypeview = hasSubType.typeview;
        myMetamodel.addRelationshipTypeView(reltypeview);
    }
}

function addSubAndContainRelviews(myMetis: akm.cxMetis, myModel: akm.cxModel, modelview: akm.cxModelView) {
    const modifiedRelshipViews = new Array();
    const mmType = myMetis.findObjectTypeByName(constants.types.AKM_METAMODEL);
    const mType = myMetis.findObjectTypeByName(constants.types.AKM_MODEL);
    const entType = myMetis.findObjectTypeByName(constants.types.AKM_ENTITY_TYPE);
    const containsType = myMetis.findRelationshipTypeByName1(constants.types.AKM_CONTAINS, mmType, entType);
    if (containsType) {
        const rels = myModel.getRelationshipsByType(containsType, false);
        for (let i = 0; i < rels?.length; i++) {
            const rel = rels[i];
            if (rel.markedAsDeleted) continue;
            addSubAndContainRelview(rel, modelview, modifiedRelshipViews);
        }
    }
    let hasSubType = myMetis.findRelationshipTypeByName1(constants.types.AKM_HAS_SUBMETAMODEL, mmType, mmType);
    if (hasSubType) {
        const rels = myModel.getRelationshipsByType(hasSubType, false);
        for (let i = 0; i < rels?.length; i++) {
            const rel = rels[i];
            if (rel.markedAsDeleted) continue;
            addSubAndContainRelview(rel, modelview, modifiedRelshipViews);
        }
    }
    hasSubType = myMetis.findRelationshipTypeByName1(constants.types.AKM_HAS_SUBMETAMODEL, mmType, mType);
    if (hasSubType) {
        const rels = myModel.getRelationshipsByType(hasSubType, false);
        for (let i = 0; i < rels?.length; i++) {
            const rel = rels[i];
            if (rel.markedAsDeleted) continue;
            addSubAndContainRelview(rel, modelview, modifiedRelshipViews);
        }
    }
}

function addSubAndContainRelview(relship: akm.cxRelationship, modelview: akm.cxModelView, modifiedRelshipViews: any[]) {
    const fromObj = relship.fromObject;
    const toObj = relship.toObject;
    const fromObjviews = modelview.findObjectViewsByObject(fromObj);
    const toObjviews = modelview.findObjectViewsByObject(toObj);
    if (fromObjviews.length > 0 && toObjviews.length > 0) {
        const relviews = modelview.findRelationshipViewsByRel(relship);
        let relview;
        if (relviews.length == 0) {
            relview = new akm.cxRelationshipView(utils.createGuid(), relship.name, relship, relship.description);
        } else if (relviews.length >= 1) {
            relview = relviews[0];
        }
        relview.setFromObjectView(fromObjviews[0]);
        relview.setToObjectView(toObjviews[0]);
        relship.addRelationshipView(relview);
        modelview.addRelationshipView(relview);
    }

}

function getContainedTypenames(objview: akm.cxObjectView, containsType: cxRelationshipType): string[] | null {
    if (!objview || !containsType) {
        return null;
    } else {
        let containedTypes = new Array();
        let obj: akm.cxObject = objview.object;
        if (obj && obj instanceof akm.cxObject) {
            const relships: akm.cxRelationship[] = obj.getOutputRelshipsByType(containsType);
            for (let i = 0; i < relships?.length; i++) {
                const relship = relships[i];
                const toObj: akm.cxObject = relship.toObject;
                const toObjtype = toObj.type;
                if (toObjtype?.name === constants.types.AKM_ENTITY_TYPE) {
                    const typename = toObj.name;
                    containedTypes.push(typename);
                }
            }
        } else {
            const relviews = objview.getOutputRelviews();
            for (let i = 0; i < relviews?.length; i++) {
                const relview = relviews[i];
                const toObjview = relview.toObjview;
                const toObj = toObjview?.object;
                const toObjtype = toObj?.type;
                if (toObjtype?.name === constants.types.AKM_ENTITY_TYPE) {
                    const typename = toObj.name;
                    containedTypes.push(typename);
                }
            }
        }
        return containedTypes;
    }
}

function getContainedMetamodels(metis: akm.cxMetis, objview: akm.cxObjectView, containsType: cxRelationshipType): akm.cxMetamodel[] {
    let containedMetamodels = new Array();
    if (!objview || !containsType) {
        return containedMetamodels;
    } else {
        let obj: akm.cxObject = objview.object;
        if (obj && obj instanceof akm.cxObject) {
            const relships: akm.cxRelationship[] = obj.getOutputRelshipsByType(containsType);
            for (let i = 0; i < relships?.length; i++) {
                const relship = relships[i];
                const toObj: akm.cxObject = relship.toObject;
                const toObjtype = toObj.type;
                if (toObjtype?.name === constants.types.AKM_METAMODEL) {
                    const metamodelName = toObj.name;
                    const metamodel = metis.findMetamodelByName(metamodelName);
                    containedMetamodels.push(metamodel);
                }
            }
        }
    }
    return containedMetamodels;
}

function getSubMetaModelObjects(obj: akm.cxObject, containsType: cxRelationshipType): cxObject[] | null {
    if (!obj || !containsType) {
        return null;
    } else {
        let subMetaModelObjects = new Array();
        const rels = obj.getOutputRelshipsByType(containsType);
        for (let i = 0; i < rels?.length; i++) {
            const rel = rels[i];
            const toObj = rel?.toObject;
            const toObjtype = toObj?.type;
            if (toObjtype?.name === constants.types.AKM_METAMODEL) {
                subMetaModelObjects.push(toObj);
            }
        }
        return subMetaModelObjects;
    }
}

function getSubModelObjects(obj: akm.cxObject, hasSubmodelType: cxRelationshipType): cxObject[] | null {
    if (!obj || !hasSubmodelType) {
        return null;
    } else {
        let subModelObjects = new Array();
        const rels = obj.getOutputRelshipsByType(hasSubmodelType);
        for (let i = 0; i < rels?.length; i++) {
            const rel = rels[i];
            const toObj = rel?.toObject;
            const toObjtype = toObj?.type;
            if (toObjtype?.name === constants.types.AKM_MODEL) {
                subModelObjects.push(toObj);
            }
        }
        return subModelObjects;
    }
}

export function generateMetamodel(objects: akm.cxObject[], relships: akm.cxRelationship[], context: any): akm.cxMetaModel {
    const myMetis = context.myMetis as akm.cxMetis;
    const myMetamodel = context.myMetamodel as akm.cxMetaModel;
    const myModel = context.myModel as akm.cxModel;
    const myGoModel = context.myGoModel;
    const myDiagram = context.myDiagram;
    const myModelview = context.myCurrentModelview as akm.cxModelView;
    const myObjectview = context.myCurrentObjectview;
    const mmType = myMetamodel.findObjectTypeByName(constants.types.AKM_METAMODEL);
    const entType = myMetamodel.findObjectTypeByName(constants.types.AKM_ENTITY_TYPE);
    const modifiedMetamodels = new Array();
    const includeSystemtypes = myModel.includeSystemtypes
    let includeMetamodelling = false;
    let targetMetamodel = context.myTargetMetamodel as akm.cxMetaModel;
    if (!targetMetamodel)
        return null;
    else {
        targetMetamodel = myMetis.findMetamodel(targetMetamodel.id);
        targetMetamodel.properties = myMetamodel.properties;
        const entType = myMetis.findObjectTypeByName(constants.types.AKM_ENTITY_TYPE);
        targetMetamodel.addObjectType(entType);
    }
    myModel.targetMetamodelRef = targetMetamodel.id;
    targetMetamodel.generatedFromModelRef = myModel.id;
    // targetMetamodel.includeSystemtypes = false; 
    const mmname = targetMetamodel.name;
    if (debug) console.log('1268 generateMetamodel 1');
    let isCoreMetamodel = false;
    if (targetMetamodel.name === constants.core.AKM_CORE_META) {
        isCoreMetamodel = true;
        includeMetamodelling = true;
    }
    // Handle viewstyle
    const vsname = mmname + '_Viewstyle';
    let vstyle = targetMetamodel.viewstyle;
    if (!vstyle) {
        vstyle = new akm.cxViewStyle(utils.createGuid(), vsname, "");
        targetMetamodel.viewstyle = vstyle;
        targetMetamodel.addViewStyle(vstyle);
        myMetis.addViewStyle(vstyle);
    }

    // Handle datatype
    let objs = myModel?.getObjectsByTypename('Datatype', false);
    if (objs) {
        // For each Datatype object call generateDatatype
        for (let i = 0; i < objs.length; i++) {
            let obj = objs[i];
            if (obj && !obj.markedAsDeleted) {
                const datatype = generateDatatype(obj, context);
                if (datatype) myMetamodel.addDatatype(datatype);
            }
        }
    }

    // Add existing method types to the new targetMetamodel
    const mtdtypes = myMetamodel.methodtypes;
    if (mtdtypes) {
        targetMetamodel.methodtypes = mtdtypes;
    }
    // For each MethodType object call generateMethodType
    objs = myModel?.getObjectsByTypename('MethodType', false);
    if (objs) {
        for (let i = 0; i < objs.length; i++) {
            let obj = objs[i];
            if (obj && !obj.markedAsDeleted) {
                let mtdType = targetMetamodel.findMethodTypeByName(obj.name);
                if (mtdType) {
                    const mtdId = mtdType.id;
                    mtdType.properties = [];
                    mtdType = generateMethodType(obj, context);
                    if (mtdType) {
                        targetMetamodel.addMethodType(mtdType);
                        myMetis.addMethodType(mtdType);
                    }
                }
            }
        }
    }
    // For each Method object call generateMethod
    objs = myModel?.getObjectsByTypename('Method', false);
    if (objs) {
        for (let i = 0; i < objs.length; i++) {
            let obj = objs[i];
            if (obj && !obj.markedAsDeleted) {
                const method = generateMethod(obj, context);
                const mtdtypename = method.methodtype;
                const methodType = myMetamodel.findMethodTypeByName(mtdtypename);
                if (debug) console.log('1325 methodType', methodType);
                if (method && methodType) {
                    method.methodtype = methodType.name;
                    const props = methodType.properties;
                    for (let i = 0; i < props?.length; i++) {
                        const propname = props[i].name;
                    }
                    if (debug) console.log('1334 method', method);
                }
            }
        }
    }
    // Add system datatypes
    let systemdtypes = ['cardinality', 'viewkind', 'relshipkind', 'fieldtype',
        'layout', 'routing', 'linkcurve',
        'integer', 'string', 'number', 'boolean', 'date',
        'reldir', 'actiontype'];
    let dtypes;
    if (includeSystemtypes) {
        dtypes = myMetamodel.datatypes;
    } else {
        dtypes = [];
        for (let i = 0; i < systemdtypes.length; i++) {
            const dtypename = systemdtypes[i];
            const dtype = myMetamodel.findDatatypeByName(dtypename);
            dtypes.push(dtype);
        }
    }
    for (let j = 0; j < dtypes.length; j++) {
        const dtype = dtypes[j];
        if (dtype) targetMetamodel.addDatatype(dtype);
    }
    // Add system types 
    // First add object types 
    let firstTime = context.firstTime;
    let objecttypes = new Array();
    let objecttypes0 = new Array();
    const coreMetamodel = myMetis.findMetamodelByName(constants.core.AKM_CORE_META);
    let containsType = coreMetamodel?.findRelationshipTypeByName1(constants.types.AKM_CONTAINS, mmType, entType);
    let containsTypeView = containsType?.typeview;
    let hasSubMetamodelType = coreMetamodel?.findRelationshipTypeByName1(constants.types.AKM_HAS_SUBMETAMODEL, mmType, mmType);
    let hasSubMetamodelView = hasSubMetamodelType?.typeview;
    let typenames = getContainedTypenames(myObjectview, containsType);
    if (typenames?.length > 0) {
        for (let i = 0; i < typenames?.length; i++) {
            const typename = typenames[i];
            // let objtype = myMetis.findObjectTypeByName(typename);
            let objtype = targetMetamodel.findObjectTypeByName(typename);
            if (objtype) {
                objecttypes.push(objtype);
                objecttypes0.push(objtype);
            }
        }
        // Add system types
        let systemTypes = getObjectSystemTypes(myMetis, false);
        objecttypes0 = [...systemTypes, ...objecttypes0];
        targetMetamodel.objecttypes0 = objecttypes0;
        systemTypes = getObjectSystemTypes(myMetis, true);
        objecttypes = [...systemTypes, ...objecttypes];
        targetMetamodel.objecttypes = objecttypes;
    }

    { // Then add relship types
        targetMetamodel.relshiptypes = getRelationshipSystemTypes(myMetamodel, true);
    }
    // Adding system types completed

    let metaObject;
    {   // Add metamodel contents
        for (let i = 0; i <= objects?.length; i++) {
            let obj = objects[i];
            if (!obj /*|| objview.markedAsDeleted*/)
                continue;
            if (!obj /*|| obj.markedAsDeleted*/)
                continue;
            if (obj && obj instanceof akm.cxObject) {
                if (obj.isOfType('Model')) {  // A group object of type Model
                    addModelToMetamodel(targetMetamodel, obj, context);
                }
                if (obj.isOfType('Metamodel')) {
                    const fromType = obj.type;
                    let toType = fromType;
                    // Follow 'contains' relationships
                    let containsType = myMetis.findRelationshipTypeByName1(constants.types.AKM_CONTAINS, fromType, toType);
                    const containedObjects = getSubMetaModelObjects(obj, containsType);
                    for (let i = 0; i < containedObjects?.length; i++) {
                        const containedObject = containedObjects[i];
                        if (containedObject) {
                            const metamodel = myMetis.findMetamodelByName(containedObject.name);
                            if (metamodel) {
                                targetMetamodel.addContainedMetamodel(metamodel);
                                configureMetamodel(obj, myMetis, myDiagram);
                                // Get object and relationship types (case: contains)
                                targetMetamodel.addMetamodelContent(metamodel);
                            }
                        }
                    }
                }
            }            
        }
    }
    const metaObjects = ['EntityType'];
    const defaultProperties = ['id', 'name', 'description', 'typeName','typeDescription'];
    { // Add or generate objecttypes
        for (let i = 0; i < metaObjects.length; i++) {
            const mObject = metaObjects[i];
            const mType = myMetamodel.findObjectTypeByName(mObject);
            if (mType) {
                metaObject = mObject;
                break;
            }
        }
        if (objects) {
            let objtypeviews = new Array();
            if (debug) console.log('1270 objects', objects);
            for (let i = 0; i < objects.length; i++) {
                let obj = objects[i];
                if (!obj /*|| obj.markedAsDeleted*/)
                    continue;
                switch (obj.type?.name) {
                    case 'Datatype':
                    case 'Value':
                    case 'FieldType':
                    case 'InputPattern':
                    case 'ViewFormat':
                    case 'MethodType':
                    case 'Method':
                    case 'Label':
                        // case 'Collection':
                        continue;
                    default:
                        // obj = myMetis.findObject(obj.id);
                        if (obj.isOfType('Property'))
                            continue;
                }
                const typenames = new Array();
                if (obj.name === obj.type?.name)
                    typenames.push(obj.type.name);
                typenames.push(metaObject);
                for (let i = 0; i < typenames.length; i++) {
                    if (typenames[i] === constants.types.AKM_ENTITY_TYPE) {
                        const objtype = myMetis.findObjectTypeByName(typenames[i]);
                        if (firstTime) {
                            objtype.properties = [];
                            firstTime = false;
                        }
                        targetMetamodel.addObjectTypeByName(objtype);
                        if (objtype && objtype.name !== constants.types.AKM_ENTITY_TYPE)
                            targetMetamodel.addObjectType0ByName(objtype);
                    }
                    const type = myMetamodel.findObjectTypeByName(typenames[i]);
                    if (type && obj && obj.type) {
                        if (type.markedAsDeleted)
                            continue;
                        // Check if obj inherits one of the specified types - otherwise do not generate type
                        let objtype: akm.cxObjectType;
                        if (
                            (obj.type.name === metaObject)
                        ) {
                            objtype = generateObjectType(obj, myObjectview, context);
                            if (objtype) targetMetamodel.addObjectTypeByName(objtype);
                            if (objtype /* && objtype.name !== constants.types.AKM_ENTITY_TYPE */) {
                                targetMetamodel.addObjectType0ByName(objtype);
                                // Check if there already is an Is relationship type between the object type and EntityType
                                const reltypes = targetMetamodel.relshiptypes;
                                let found = false;
                                for (let i = 0; i < reltypes.length; i++) {
                                    const reltype = reltypes[i];
                                    if (reltype.name === constants.types.AKM_IS) {
                                        if (reltype.fromObjtype?.name === objtype.name && reltype.toObjtype?.name === constants.types.AKM_ENTITY_TYPE) {
                                            found = true;
                                            break;
                                        }
                                    }
                                }
                                if (!found) {
                                    // Create an Is relationship between the new object type and EntityType
                                    const uid = utils.createGuid();
                                    const toObjtype = targetMetamodel.findObjectTypeByName(constants.types.AKM_ENTITY_TYPE);
                                    const reltype = new akm.cxRelationshipType(uid, constants.types.AKM_IS, objtype, toObjtype);
                                    myMetis.addRelationshipType(reltype);
                                    targetMetamodel.addRelationshipType(reltype);
                                }
                                // Handle typeviews
                                let typeview = objtype.typeview;
                                // First get all objectviews of obj in the actual model
                                let objviews = myModelview.findObjectViewsByObject(obj);
                                for (let i=0; i<objviews?.length; i++) {
                                    const oview = objviews[i];
                                    if (oview) {
                                        let newName = oview.name;
                                        newName = utils.camelize(newName);
                                        oview.name = utils.capitalizeFirstLetter(newName);
                                        if (oview.name === objtype.name) {
                                            typeview.applyObjectViewParameters(oview);
                                            oview.template = typeview.template;
                                            objtypeviews.push(typeview);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // Then get all typeviews for the object type in the target metamodel
                    objtypeviews = utils.removeArrayDuplicates(objtypeviews);
                    targetMetamodel.objecttypeviews = objtypeviews;
                }
            }
        }
    }
    // Add or generate relationship types
    { // First handle objects of type "RelshipType"
        let relshiptypeByNames: string[] = new Array();
        for (let i = 0; i < objects?.length; i++) {
            const obj = objects[i];
            if (!obj)
                continue;
            if (!obj || !(obj instanceof akm.cxObject))
                continue;
            if (obj.type.name !== constants.types.AKM_RELSHIP_TYPE)
                continue;
            // Find fromObject and toObject
            let rels = obj.getOutputRelships(myModel, constants.relkinds.REL);
            let fromObjects: akm.cxObject[] = new Array();
            let toObjects: akm.cxObject[]  = new Array();
            let fromObjType: akm.cxObjectType; 
            let toObjType: akm.cxObjectType;
            let fromObjTypes: akm.cxObjectType[] = new Array();
            let toObjTypes: akm.cxObjectType[] = new Array();
            let supertypes: akm.cxObjectType[] = new Array();
            let fromObj: akm.cxObject, toObj: akm.cxObject;
            let fromtypename: string, totypename: string;
            let reltypename = obj.name;
            const len = rels?.length;
            for (let i = 0; i < len; i++) {
                const rel = rels[i];
                if (rel.name === 'from') {
                    fromObj = rel.toObject;
                    fromtypename = fromObj?.name;
                    fromObjects.push(fromObj);
                    fromObjType = targetMetamodel.findObjectTypeByName(fromtypename);
                    fromObjTypes.push(fromObjType);
                } else if (rel.name === 'to') {
                    toObj = rel.toObject;
                    toObjects.push(toObj);
                    totypename = toObj?.name;
                    toObjType = targetMetamodel.findObjectTypeByName(totypename);
                    toObjTypes.push(toObjType);
                }
            }
            let reltype = [reltypename, fromtypename, totypename];
            relshiptypeByNames.push(reltype);

            // Then handle inheritance from object types
            rels = obj.getOutputRelships(myModel, constants.relkinds.GEN);
            for (let i = 0; i < rels.length; i++) {
                const rel = rels[i];
               if (rel?.name === 'Is') {
                    rel.relshipkind = constants.relkinds.GEN; // Generalization
                    fromObj = rel.fromObject; // fromObj is the RelshipType object itself (obj)
                    fromtypename = fromObj?.name;  // e.g. 'refersTo'
                    toObj = rel.toObject;     // toObj represents the object type to inherit from
                    totypename = toObj?.name;  // i.e. some object type    
                    toObjType = targetMetamodel.findObjectTypeByName(totypename);                
                    supertypes.push(toObjType);
                }
            }
            // Remove duplicates
            relshiptypeByNames = [... new Set(relshiptypeByNames)];
            supertypes = [... new Set(supertypes)];

            // Now generate the relationship types
            for (let i = 0; i < relshiptypeByNames.length; i++) {
                let rtype = myMetis.findRelationshipTypeByName1(reltypename, fromObjTypes[i], toObjTypes[i]);
                if (!rtype) {
                    // This is a new relationship type
                    rtype = generateRelshipType2(obj, fromObjType, toObjType, context);
                }
                if (rtype) {
                    // Handle typeview
                    const relTypeview = rtype.typeview as akm.cxRelationshipTypeView;
                    if (relTypeview) {
                        targetMetamodel.addRelationshipTypeView(relTypeview);
                    }
                    // Handle properties
                    const typeprops: akm.cxProperty[] = new Array();
                    getTypeProperties(obj, typeprops, myModel);
                    // getAllPropertytypes(obj, typeprops, myModel);
                    addProperties(rtype, typeprops, context);
                    targetMetamodel.addRelationshipType(rtype);
                    myMetis.addRelationshipType(rtype);
                }
            }
        }
        if (debug) console.log(relshiptypes);
    }
    { // Then handle relationships of type "relationshipType"
        if (relships) {
            for (let i = 0; i < relships.length; i++) {
                const rel = relships[i] as akm.cxRelationship;
                const relviews = myModelview.findRelationshipViewsByRel(rel) as akm.cxRelationshipView[];
                const relview = relviews[0];
                if (!relview) continue;
                 if (debug) console.log('1427 rel.name', rel.name);
                if (rel.isSystemRel()) {
                    continue;
                }
                if (rel.name === constants.types.AKM_CONTAINS) {
                    continue;
                }
                const fromObj = rel.fromObject as akm.cxObject;
                if (!fromObj) continue;
                // let fromObj = fromObjview?.object as akm.cxObject;
                // fromObj = myModel.findObjectByName(fromObj?.name);
                const toObj = rel.toObject as akm.cxObject;
                if (!toObj) continue;
                // if (!toObjview) continue;
                // let toObj = toObjview?.object as akm.cxObject;
                // toObj = myModel.findObjectByName(toObj.name);
                if (rel.name === constants.types.AKM_IS) {
                    for (let j = 0; j < objecttypes.length; j++) {
                        const otype1 = objecttypes[j];
                        if (fromObj?.id === otype1?.id) {
                            for (let k = 0; k < objecttypes.length; k++) {
                                const otype2 = objecttypes[j];
                                if (toObj?.id === otype2?.id)
                                    continue;
                            }
                        }
                    }
                }
                if (fromObj && fromObj instanceof akm.cxObject &&
                    toObj && toObj instanceof akm.cxObject) {
                    if (fromObj?.isOfSystemType(metaObject) &&
                        toObj?.isOfSystemType(metaObject)) {
                        let rtype = myMetis.findRelationshipTypeByNames(rel.name, fromObj.name, toObj.name);
                        if (!rtype) {
                            rtype = generateRelshipType(rel, relview, context);
                        }
                        if (rel.relshipviews?.length > 0) {
                            let relview;
                            for (let j=0; j<rel.relshipviews.length; j++) {
                                relview = rel.relshipviews[j];
                                relview = myModelview.findRelationshipView(relview.id);
                                if (relview) break;
                            }
                            if (relview?.template2) {
                                relview.template = relview.template2;
                            }
                        }
                
                        // Prepare dispatches
                        if (rtype) {
                            myMetis.addRelationshipType(rtype);
                            targetMetamodel.addRelationshipType(rtype);
                            if (rtype.name !== constants.types.AKM_RELSHIP_TYPE
                                && rtype.name !== constants.types.AKM_IS) {
                                targetMetamodel.addRelationshipType0(rtype);
                            }

                            // Handle typeviews
                            // First get all typeviews for the relship type in the target metamodel
                            const typeview = rtype?.typeview;
                            const reltypeviews = targetMetamodel.removeAllRelshipTypeViewsByRelshipType(rtype);
                            if (typeview) {
                                reltypeviews.push(typeview);
                            }
                            targetMetamodel.relshiptypeviews = reltypeviews;
                            // Then handle relationship typeview
                            const relTypeview = rtype.typeview;
                            if (relTypeview) {
                                relTypeview.applyRelationshipViewParameters(relview);
                                targetMetamodel.addRelationshipTypeView(relTypeview);
                                myMetis.addRelationshipTypeView(relTypeview);
                                rtype.setDefaultTypeView(relTypeview);
                            }
                        }
                    }
                }
            }
        }
    }
    { // Then handle pointer datatypes (To Be Done)
        // objects = myModel?.getObjectsByTypename('Datatype', false);
        // if (objects) {
        //     // For each pointer Datatype object call generatePointerDatatype
        //     for (let i=0; i<objects.length; i++) {
        //         let obj = objects[i];
        //         if (obj && !obj.markedAsDeleted)
        //             generatePointerDatatype(obj, context);
        //     }
        // }
    }
    { // Then handle inheritance between entity types
        const rels = myModel?.getRelationshipsByTypeName(constants.types.AKM_IS, constants.relkinds.GEN);
        if (debug) console.log('1346 myModel, rels', myModel, rels);
        const relviews = new Array();
        if (rels) {
            for (let i = 0; i < rels.length; i++) {
                const rel = rels[i];
                const rviews = myModelview.findRelationshipViewsByRel(rel);
                for (let j = 0; j < rviews?.length; j++) {
                    const rview = rviews[j];
                    relviews.push(rview);
                }
            }
            for (let i = 0; i < relviews.length; i++) {
                const rview = relviews[i];
                const rel = rview.relship;
                const fromObj = rel.fromObject;
                const toObj = rel.toObject;
                if (fromObj && toObj) {
                    const fromType = targetMetamodel.findObjectTypeByName(fromObj.name);
                    const toType = targetMetamodel.findObjectTypeByName(toObj.name);
                    if (fromType && toType) {
                        // We want to add an Is relationship between fromType and toType
                        let found = false;
                        const reltypes = targetMetamodel.findRelationshipTypesBetweenTypes(fromType, toType, false);
                        if (debug) console.log('1360 targetMetamodel, reltypes', targetMetamodel, reltypes);
                        // Check if the Is relationship type already exists
                        if (reltypes) {
                            for (let i = 0; i < reltypes.length; i++) {
                                const reltype = reltypes[i];
                                if (reltype.name === constants.types.AKM_IS) {
                                    found = true;
                                    break;
                                }
                            }
                        }
                        if (!found) {
                            // The Is relationship type does not exist, so create it
                            const reltype = new akm.cxRelationshipType(utils.createGuid(), constants.types.AKM_IS, fromType, toType, "");
                            reltype.relshipkind = constants.relkinds.GEN;
                            fromType.addOutputreltype(reltype);
                            if (debug) console.log('1374 fromType, toType, reltype', fromType, toType, reltype);
                            targetMetamodel.addRelationshipType(reltype);
                        }
                    }
                }
            }
        }
    }
    targetMetamodel.includeInheritedReltypes = myModel.includeSystemtypes;
    myMetis.currentTargetMetamodel = targetMetamodel;
    myMetis.currentTargetModel = myModel;
    { // Remove duplicate relationship types
        const reltypes = targetMetamodel.relshiptypes;
        for (let j = 0; j < reltypes?.length; j++) {
            const reltype = reltypes[j];
            for (let k = j + 1; k < reltypes?.length; k++) {
                const rtype = reltypes[k];
                if (reltype.fromobjtypeRef === rtype.fromobjtypeRef
                    && reltype.toobjtypeRef === rtype.toobjtypeRef
                    && reltype.name === rtype.name) {
                    reltypes.splice(k, 1);
                    k--;
                }
            }
        }
        // Prepare the dispatches
        for (let j = 0; j < reltypes?.length; j++) {
            const reltype = reltypes[j];
            targetMetamodel.addRelationshipType(reltype);
            myMetis.addRelationshipType(reltype);
         }
    }
    uic.repairEntityType(myMetis, targetMetamodel, myDiagram);
    myMetis.addMetamodel(targetMetamodel);
    myMetis.metamodels = [...new Set(myMetis.metamodels)];
    // modifiedMetamodels.push(targetMetamodel);

    // Check if the metamodel is used as a sub-metamodel in another metamodel
    const metamodels = myMetis.metamodels;
    for (let i = 0; i < metamodels?.length; i++) {
        const metamodel = metamodels[i];
        const subMetamodels = metamodel.submetamodels;
        for (let j = 0; j < subMetamodels?.length; j++) {
            const subMetamodel = subMetamodels[j];
            if (subMetamodel.id === targetMetamodel.id) {
                subMetamodels.splice(j, 1);
                j--;
            }
        }
        metamodel.submetamodels = subMetamodels;
        // if (subMetamodels?.length > 0) {
        //     const jsnMetamodel = new jsn.jsnMetaModel(metamodel, true);
        //     if (debug) console.log('1920 generateMetamodel 2');
        // }
    }
    return targetMetamodel;
}

export function configureMetamodel(object: akm.cxObject, myMetis: akm.cxMetis, myDiagram: any) {
    const name = object.name; // Name of metamodel
    const myModelview = myMetis.currentModelview as akm.cxModelView;
    let myMetamodel = myMetis.findMetamodelByName(name);
    let entityType = myMetis.findObjectTypeByName(constants.types.AKM_ENTITY_TYPE);
    if (!myMetamodel) {
        myMetamodel = new akm.cxMetaModel(utils.createGuid(), object.name, object.description);
        myMetis.addMetamodel(myMetamodel);
        // Add inherited object types
        const element = myMetis.findObjectTypeByName(constants.types.AKM_ELEMENT);
        myMetamodel.addObjectType(element);
        myMetamodel.addObjectType(entityType);
        const container = myMetis.findObjectTypeByName(constants.types.AKM_CONTAINER);
        myMetamodel.addObjectType(container);
        const generic = myMetis.findObjectTypeByName(constants.types.AKM_GENERIC);
        myMetamodel.addObjectType(generic);
        const label = myMetis.findObjectTypeByName(constants.types.AKM_LABEL);
        myMetamodel.addObjectType(label);
        // Add inherited relationship types
        let reltypes = myMetis.findRelationshipTypesBetweenTypes1(element, element, false);
        for (let i = 0; i < reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(label, element, false);
        for (let i = 0; i < reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(generic, element, false);
        for (let i = 0; i < reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(container, element, false);
        for (let i = 0; i < reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(entityType, element, false);
        for (let i = 0; i < reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(entityType, entityType, false);
        for (let i = 0; i < reltypes?.length; i++) {
            const reltype = reltypes[i];
            if (reltype.name === constants.types.AKM_RELATIONSHIP_TYPE)
                continue;
            myMetamodel.addRelationshipType(reltype);
        }
    } else {
        myMetamodel.description = object.description;
    }
    // Do the configuration
    const isType = myMetis.findRelationshipTypeByName(constants.types.AKM_IS);
    const containsType = myMetis.findRelationshipTypeByName(constants.types.AKM_CONTAINS);
    const hasSubMetamodelType = myMetis.findRelationshipTypeByName(constants.types.AKM_HAS_SUBMETAMODEL);
    const obj = myMetis.findObject(object.id);
    // Handle contains relationships
    let relships = obj?.getOutputRelshipsByType(containsType);
    for (let i = 0; i < relships?.length; i++) {
        const relship = relships[i];
        const target = relship.toObject;
        if (target.type.name === constants.types.AKM_METAMODEL) {
            configureMetamodel(target, myMetis, myDiagram);
            myMetamodel.addContainedMetamodel(target);
        }
        const targetObjectType = myMetamodel.findObjectTypeByName(target.name);
        if (targetObjectType && targetObjectType.name !== constants.types.AKM_METAMODEL) {
            myMetamodel.addObjectType(targetObjectType);
            myMetamodel.addObjectType0(targetObjectType);
            // Get or create Is relationship type to Entity Type
            let reltype = myMetis.findRelationshipTypeByName1(isType.name, targetObjectType, entityType);
            if (!reltype) {
                reltype = new akm.cxRelationshipType(utils.createGuid(), isType.name, targetObjectType, entityType, isType.description);
            }
            if (reltype) {
                myMetamodel.addRelationshipType(reltype);
                myMetis.addRelationshipType(reltype);
            }
        }
        if (target && target.type.name === constants.types.AKM_METAMODEL) {
            const metamodel = myMetis.findMetamodelByName(target.name);
            myMetamodel.addContainedMetamodel(metamodel);
        }
        myMetamodel.embedContainedMetamodels();
    }
    // Handle hasSubMetamodel relationships
    relships = obj.getOutputRelshipsByType(hasSubMetamodelType);
    for (let i = 0; i < relships?.length; i++) {
        const relship = relships[i];
        const target = relship.toObject;
        if (target.type.name === constants.types.AKM_METAMODEL) {
            const subMetamodel = myMetis.findMetamodelByName(target.name);
            if (subMetamodel) {
                myMetamodel.addSubMetamodel(subMetamodel);
            }
        }
    }
    // Handle relationships between the object types
    const objtypes = myMetamodel.objecttypes0;
    for (let i = 0; i < objtypes?.length; i++) {
        const objtype = objtypes[i];
        const reltypes = objtype.getOutputReltypes();
        for (let j = 0; j < reltypes?.length; j++) {
            const reltype = reltypes[j];
            if (reltype.name === constants.types.AKM_IS)
                continue;
            myMetamodel.addRelationshipType(reltype);
            myMetamodel.addRelationshipType0(reltype);
        }
    }
    // Handle relationships between the object types across sub-metamodels
    const objviews = myModelview?.objectviews;
    for (let i = 0; i < objviews?.length; i++) {
        const fromObjview = objviews[i];
        const relviews = fromObjview.getOutputRelviews();
        for (let j = 0; j < relviews?.length; j++) {
            const relview = relviews[j];
            const toObjview = relview.toObjview;
            for (let j = 0; j < objviews?.length; j++) {
                const oview = objviews[j];
                if (toObjview.id === oview.id) {
                    const rel = relview.relship;
                    const reltype = rel.type;
                    if (reltype.name === constants.types.AKM_IS)
                        continue;
                    myMetamodel.addRelationshipType(reltype);
                    myMetamodel.addRelationshipType0(reltype);
                }
            }
        }
    }
    if (false) {
        // Handle viewstyles
        // Handle hasViewstyle relationships
        const hasViewstyleType = myMetis.findRelationshipTypeByName(constants.types.AKM_HAS_VIEWSTYLE);
        const viewstyles = [];
        const rels = obj.getOutputRelshipsByType(hasViewstyleType);
        for (let i = 0; i < relships?.length; i++) {
            const relship = rels[i];
            if (!relship || !relship.toObject)
                continue;
            if (relship.toObject?.type?.name === constants.types.AKM_VIEWSTYLE) {
                viewstyles.push(relship.toObject);
            }
        }
        if (viewstyles.length === 1) {
            const viewstyleobj = myMetis.findObject(viewstyle.id);
            if (viewstyleobj) {
                const guid = utils.createGuid();
                const viewstyle = new akm.cxViewstyle(guid, viewstyleobj.name, viewstyleobj.description);
                myMetamodel.addViewstyle(viewstyle);
            }
        }
    }
    // Do the dispatches
    const jsnMetamodel = new jsn.jsnMetaModel(myMetamodel, true);
    myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data: jsnMetamodel });
}

function addModelToMetamodel(metamodel: akm.cxMetaModel, object: akm.cxObject, context: any) {
    // object represents the model
    const myMetis = context.myMetis as akm.cxMetis;
    const myDiagram = context.myDiagram;
    const subMetamodels = metamodel.submetamodels;   // e.g. IRTV metamodel
    const myModelview = context.myCurrentModelview;
    // Find the objectview of the object representing the model
    const objtype = object.type;
    let objectview;
    const objectviews = myModelview.objectviews;
    for (let i = 0; i < objectviews?.length; i++) {
        const objview = objectviews[i];
        if (objview.object?.id === object.id) {
            objectview = objview;
            break;
        }
    }
    // Find submetamodel
    let subMetamodel = subMetamodels[0] as akm.cxMetaModel;
    for (let i = 0; i < subMetamodels?.length; i++) {
        const submeta = subMetamodels[i];
        if (submeta.findObjectTypeByName(objtype.name)) {
            subMetamodel = submeta;
            break;
        }
    }
    // Check if the model already exists
    let model, modelview;
    model = myMetis.findModelByName(object.name) as akm.cxModel;
    if (!model) {
        model = new akm.cxModel(utils.createGuid(), object.name, subMetamodel, object.description);
        modelview = new akm.cxModelView(utils.createGuid(), object.name, model, "");
    } else {
        let modelviews = model.modelviews;
        if (modelviews?.length) {
            modelview = modelviews[0];
        } else {
            modelview = new akm.cxModelView(utils.createGuid(), object.name, model, "");
            model.addModelView(modelview);
        }
        modelview = model.modelviews[0];
    }
    // Fill the model with its content
    // objview is the group 
    const group = objectview as akm.cxObjectView;
    if (group) {
        const objviews = group.getGroupMembers(myModelview);
        for (let i = 0; i < objviews?.length; i++) {
            const member = objviews[i];
            const memberObj = member.object;
            if (memberObj) {
                model.addObject(memberObj);
                modelview.addObjectView(member);
            }
        }
        const relviews = myModelview.getRelshipviewsInGroup(group);
        for (let i = 0; i < relviews?.length; i++) {
            const relview = relviews[i];
            const rel = relview.relship;
            if (rel) {
                model.addRelationship(rel);
                modelview.addRelationshipView(relview);
            }
        }
    }
    metamodel.addSubModel(model);
    model.addModelView(modelview);
    myMetis.addModel(model);
    myMetis.addModelView(modelview);
    const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
    let data = { metis: jsnMetis }
    data = JSON.parse(JSON.stringify(data));
    // The following dispatch fails ): The submodels are not added to the metamodel
    myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
    // End of failure
}

function buildTemporaryModelView(context: any): akm.cxModelView {
    const modelview = context.myCurrentModelview;
    const model = context.myModel;
    let objlist = [];
    let rellist = [];
    let objectviews = modelview.objectviews;
    for (let i = 0; i < objectviews?.length; i++) {
        const objview = objectviews[i];
        let obj = objview.object as akm.cxObject;
        if (debug) console.log('822 model, obj, objview', model, obj, objview);
        if (obj) {
            obj = model.findObject(obj.id);
            objlist.push(obj);
            addToObjAndRelLists(model, obj, objlist, rellist);
        }
    }
    let uniquelist = [...new Set(objlist)];
    objlist = uniquelist;
    let relshipviews = modelview.relshipviews;
    for (let i = 0; i < relshipviews?.length; i++) {
        const relview = relshipviews[i];
        if (debug) console.log('830 relview', relview);
        const rel = relview.relship;
        if (rel) {
            let fromObj = rel.fromObject;
            fromObj = model.findObject(fromObj?.id);
            let toObj = rel.toObject;
            toObj = model.findObject(toObj?.id);
            if (fromObj && toObj) {
                rel.fromObject = fromObj;
                rel.toObject = toObj;
                rellist.push(rel);
            }
        }
    }
    if (debug) console.log('841 rellist', rellist);
    uniquelist = [...new Set(rellist)];
    rellist = uniquelist;
    if (debug) console.log('844 objlist, rellist', objlist, rellist);
    // Build tempModelview
    const tempModelview = new akm.cxModelView(utils.createGuid(), '_TEMPVIEW', model, 'Temporary modelview');
    // First handle the objects
    for (let i = 0; i < objlist.length; i++) {
        const obj = objlist[i];
        if (!obj) continue;
        const noObjviews = obj.objectviews?.length;
        let objview;
        if (noObjviews > 0)
            objview = obj.objectviews[0];
        else
            objview = new akm.cxObjectView(utils.createGuid(), obj.name, obj, "");
        obj.addObjectView(objview);
        tempModelview.addObjectView(objview);
    }
    // Then handle the relationships
    for (let i = 0; i < rellist.length; i++) {
        const rel = rellist[i];
        if (!rel) continue;
        const fromObj = rel.fromObject;
        const toObj = rel.toObject;
        if (fromObj && toObj) { // changed
            const noRelviews = rel.relshipviews?.length;
            let relview;
            if (noRelviews > 0) {
                relview = rel.relshipviews[0];
                relview.category = constants.gojs.C_RELSHIPVIEW;
                if (debug) console.log('862 relview', relview);
            } else {
                relview = new akm.cxRelationshipView(utils.createGuid(), rel.name, rel, "");
                if (debug) console.log('865 relview', relview);
            }
            const fromObjview = fromObj?.objectviews ? fromObj?.objectviews[0] : null;
            const toObjview = toObj?.objectviews ? toObj?.objectviews[0] : null;
            if (!fromObjview || !toObjview) continue;
            relview.setFromObjectView(fromObjview);
            relview.setToObjectView(toObjview);
            tempModelview.addRelationshipView(relview);
            if (debug) console.log('877 relview', relview);
        }
    }
    if (debug) console.log('880 tempModelview', tempModelview);
    return tempModelview;
}

function addToObjAndRelLists(model: akm.cxModel, obj: akm.cxObject, objlist: any, rellist: any) {
    if (!obj) return;
    const relships = obj.getOutputRelships(model, constants.relkinds.GEN);
    if (relships?.length) {
        for (let i = 0; i < relships?.length; i++) {
            const rel = relships[i];
            if (rel) {
                const toObj = rel.toObject;
                if (toObj) {
                    objlist.push(toObj);
                    rellist.push(rel);
                }
            }
        }
    }
}

function getAllPropertytypes(obj: akm.cxObject, typeprops: akm.cxProperty[], myModel: akm.cxModel): cxObject[] | cxRelationship[] {
    // Check if obj inherits another obj
    const genrels = obj?.getOutputRelships(myModel, constants.relkinds.GEN);
    if (genrels) {
        for (let i = 0; i < genrels.length; i++) {
            const rel = genrels[i];
            const toObj = rel?.toObject as akm.cxObject;
            if (toObj) {
                getAllPropertytypes(toObj, typeprops, myModel);
            }
        }
    }
    return getTypeProperties(obj, typeprops, myModel);
}

function getTypeProperties(obj: akm.cxObject, typeprops: akm.cxProperty[], myModel: akm.cxModel): cxObject[] | cxRelationship[] {
    const rels = obj?.getOutputRelships(myModel, constants.relkinds.REL);
    for (let i = 0; i < rels?.length; i++) {
        const rel = rels[i];
        const toObj = rel?.getToObject();
        if (toObj.type?.name === constants.types.AKM_PROPERTY) {
            const proptype = rel?.getToObject();
            // Check if property type already exists
            for (let j = 0; j < typeprops.length; j++) {
                if (proptype.name === typeprops[j].name)
                    continue;
            }
            typeprops.push(proptype);
        }
        if (rel?.type?.name === constants.types.AKM_HAS_COLLECTION) {
            if (toObj.type?.name === constants.types.AKM_COLLECTION) {
                const rels = toObj.outputrels;
                for (let j = 0; j < rels?.length; j++) {
                    const rel = rels[j];
                    if (rel?.type?.name === constants.types.AKM_CONTAINS) {
                        const o = rel.toObject;
                        if (o?.type?.name === constants.types.AKM_PROPERTY)
                            typeprops.push(o);
                    }
                }
            }
        }
        if (rel?.type?.name === constants.types.AKM_HAS_PROPERTIES) {
            if ((toObj.type?.name === constants.types.AKM_CONTAINER) ||
                (toObj.type.viewkind === constants.viewkinds.CONT)) {
                const oviews = toObj.objectviews;
                for (let j = 0; j < oviews.length; j++) {
                    const oview = oviews[j];
                    const grpId = oview.id;
                    getPropertiesInGroup(grpId, typeprops, myModel);
                }
            }
        }
    }
    return typeprops;
}

function getInheritedProperties(obj: akm.cxObject, properties: any[], myModel: akm.cxModel): any[] {
    // Check if obj inherits another obj
    const genrels = obj?.getOutputRelships(myModel, constants.relkinds.GEN);
    if (genrels) {
        for (let i = 0; i < genrels.length; i++) {
            const rel = genrels[i];
            const toObj = rel?.toObject as akm.cxObject;
            const type = toObj?.type;
            const props = type.properties;
            for (let j = 0; j < props.length; j++) {
                const prop = props[j];
                properties.push(prop);
            }
            getInheritedProperties(toObj, properties, myModel);
        }
    }
    return properties;
}

function getPropertiesInGroup(groupId: string, typeprops: any[], myModel: akm.cxModel): any[] {
    const objects = myModel.getObjects();
    for (let i = 0; i < objects?.length; i++) {
        const obj = objects[i];
        if (obj?.type?.name !== constants.types.AKM_PROPERTY)
            continue;
        const objviews = obj?.objectviews;
        for (let j = 0; j < objviews?.length; j++) {
            const objview = objviews[j];
            if (objview && objview.group === groupId) {
                typeprops.push(obj);
            }
        }
    }
    return typeprops;
}

function addProperties0(type: akm.cxType | akm.cxMethodType, context: any) {
    const myMetis = context.myMetis;
    const myModel = context.myModel;
    const myTargetMetamodel = context.myTargetMetamodel;
    const myDiagram = context.myDiagram;
    const typeprops = type.properties;

}

function addProperties(type: akm.cxType | akm.cxMethodType, typeprops: akm.cxProperty[], context: any) {
    const myMetis: akm.cxMetis = context.myMetis;
    const myModel: akm.cxModel = context.myModel;
    const myTargetMetamodel: akm.cxMetamodel = context.myTargetMetamodel;
    const myDiagram = context.myDiagram;
    for (let i = 0; i < typeprops.length; i++) {
        // Check if property already exists
        let proptype = typeprops[i] as akm.cxObject;
        if (proptype && proptype instanceof akm.cxObject) {
            const readOnly = proptype.readOnly;
            let prop = type.findPropertyByName(proptype.name);
            if (prop)
                prop = myMetis.findProperty(prop.id);
            if (!prop) {
                // New property - create it
                prop = new akm.cxProperty(utils.createGuid(), proptype.name, proptype.description);
                let datatype = myMetis.findDatatypeByName("string");
                prop.setDatatype(datatype);
                type.addProperty(prop);
                myTargetMetamodel.addProperty(prop);
                myMetis.addProperty(prop);
            } else {
                prop.readOnly = readOnly;
                type.addProperty(prop);
                myTargetMetamodel.addProperty(prop);
                myMetis.addProperty(prop);
            }
            // }
            if (prop) {
                // const p = myMetis.findProperty(prop.id);
                // prop = p ? p : prop;
                // Find datatype connected to current property
                if (proptype && proptype instanceof akm.cxObject) {
                    let rels = proptype.getOutputRelships(myModel, constants.relkinds.REL);
                    if (prop && rels) {
                        for (let i = 0; i < rels.length; i++) {
                            let rel = rels[i];
                            if (!rel.markedAsDeleted) {
                                if (rel.name === constants.types.AKM_IS_OF_DATATYPE) {
                                    let dtype = rel.toObject;
                                    if (dtype) {
                                        const datatype = myMetis.findDatatypeByName(dtype.name);
                                        if (datatype) prop.setDatatype(datatype);
                                    }
                                }
                                if (false) {
                                    // if (rel.name === constants.types.AKM_HAS_UNIT) {
                                    //     let u = rel.toObject;
                                    //     if (u) {
                                    //         const unit = myMetis.findUnitByName(u.name);
                                    //         if (unit) prop.setUnit(unit);
                                    //     }
                                    // }
                                }
                            }
                            type.addProperty(prop);
                            myTargetMetamodel?.addProperty(prop);
                            myMetis.addProperty(prop);
                        }
                    }
                    // Find method connected to current property
                    rels = proptype.getOutputRelships(myModel, constants.relkinds.REL);
                    if (prop && rels) {
                        for (let i = 0; i < rels.length; i++) {
                            let rel = rels[i];
                            if (!rel.markedAsDeleted) {
                                const reltype = rel.type;
                                if (reltype.name === constants.types.AKM_HAS_METHOD &&
                                    rel.name === constants.types.AKM_HAS_METHOD) {
                                    const toObj = rel.toObject;
                                    if (toObj.type.name === constants.types.AKM_METHOD) {
                                        const mtd = toObj;
                                        if (mtd) {
                                            const method = myMetis.findMethodByName(mtd.name);
                                            if (method) {
                                                prop.setMethod(method);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function isIRTVtype(objview: akm.cxObject) { }
