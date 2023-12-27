// @ts-nocheck
const debug = false;

import * as utils from './utilities';
import * as akm from './metamodeller';
import * as jsn from './ui_json';
import { has } from 'immer/dist/internal';
const constants = require('./constants');

export function askForMetamodel(context: any, create: boolean) {
    const myMetis = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const metamodels = myMetis.metamodels;
    if (debug) console.log('17 ui_generateTypes', context);
    
    let mmlist = "";
    for (let i=0; i<metamodels.length; i++) {
        const mm = metamodels[i];
        if (mm.name === constants.admin.AKM_ADMIN_MM)
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
        if (debug) console.log('41 askForMetamodel', myMetis);
        if (!metamodel) {
            if (confirm("Create new metamodel '" + mmname + "' ?")) {
                metamodel = new akm.cxMetaModel(utils.createGuid(), mmname, "");
                myMetis.addMetamodel(metamodel);
            } else {
                alert("Operation was cancelled!");
                return;
            }
        }
        if (debug) console.log('51 myMetis', myMetis);
        return metamodel;
    }
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

export function generateObjectType(object: akm.cxObject, objview: akm.cxObjectView, context: any) { 
    if (!object) {
        return;
    }
    const myDiagram   = context.myDiagram;
    const myMetis     = context.myMetis;
    const myTargetMetamodel = context.myTargetMetamodel;
    let typid = object.generatedTypeId;
    const myMetamodel = myMetis.currentMetamodel;
    const myModel              = context.myModel;
    const myModelView          = context.myCurrentModelview;
    const modifiedObjects      = new Array();
    const modifiedObjectTypes  = new Array();
    const modifiedObjectTypeViews = new Array();
    const modifiedRelships     = new Array();
    const modifiedRelshipTypes = new Array();
    const modifiedTypeGeos     = new Array();
    // 'object' is the object defining the object type to be generated
    const currentObj = myMetis.findObject(object.id) as akm.cxObject;
    let parentRelType: akm.cxRelationshipType | null = null;
    let newName  = object.name;
    let oldName = "";
    newName = utils.camelize(newName);
    newName = utils.capitalizeFirstLetter(newName);
    let objname = newName;
    if (debug) console.log('83 newName', newName);
    let objtype: akm.cxObjectType;
    if (typid) { // The object type exists - has been generated before
        objtype = myMetis.findObjectType(typid);
        if (objtype) {
            oldName = objtype.getName();
            objtype.setName(newName);
            objtype.setDescription(object.description);
            // objtype.typeDescription = currentObj.typeDescription;
        }
    } else // Check if the type has not been generated, but exists anyway
    {        
        objtype = myMetis.findObjectTypeByName(currentObj.name);
    }
    if (!objtype) { // This is a new object type
        let metaObjectName;
        const metaObjectNames = ['EntityType'];
        for (let i=0; i<metaObjectNames.length; i++) {
            const mObjectName = metaObjectNames[i];
            const mType = myMetamodel.findObjectTypeByName(mObjectName);
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
            objtype = new akm.cxObjectType(utils.createGuid(), name, currentObj.description);
        }
    }
    if (!objtype) { // The type generation failed
        return null;
    }
    if (objtype) { // The type has been generated - fullfill the generation
        objtype.setViewKind(currentObj.getViewKind());
        objtype.setAbstract(currentObj.getAbstract());
        objtype.setModified();
        objtype.markedAsDeleted = object.markedAsDeleted;
        { // Handle local inheritance
            const inheritanceObjects = currentObj.getInheritanceObjects(myModel);
            for (let i=0; i<inheritanceObjects.length; i++) {
                const inhObj = inheritanceObjects[i];
                const inhObjType = myMetis.findObjectType(inhObj.generatedTypeId);
                if (inhObjType) {
                    let parentRelType = myTargetMetamodel.findRelationshipTypeByName2(constants.types.AKM_IS, objtype, inhObjType);
                    if (!parentRelType) {
                        // Create 'Is' relationship type
                        parentRelType  = new akm.cxRelationshipType(utils.createGuid(), constants.types.AKM_IS, objtype, inhObjType, "");
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
            objtype.viewkind = currentObj.viewkind;
        }
        myTargetMetamodel?.addObjectType(objtype);
        myMetis.addObjectType(objtype);
        object.generatedTypeId = objtype.getId();
        const jsnObject = new jsn.jsnObject(object);
        modifiedObjects.push(jsnObject);        
        { // Create objecttypeview
            const id = utils.createGuid();
            const objtypeview = new akm.cxObjectTypeView(id, objtype.name, objtype, currentObj.description);
            objtypeview.applyObjectViewParameters(objview);
            if (debug) console.log('138 objtype, objtypeview', objtype, objtypeview);
            objtype.typeview = objtypeview;
            objtype.setModified();
            myMetis.addObjectTypeView(objtypeview);
        }        
        { // Create type geos
            if (!myTargetMetamodel.objtypegeos) 
                myTargetMetamodel.objtypegeos = new Array();
            const objtypegeo = new akm.cxObjtypeGeo(utils.createGuid(), myTargetMetamodel, objtype, "0 0", "100 50");
            if (objtypegeo) {
                myTargetMetamodel.addObjtypeGeo(objtypegeo);
                const jsnObjTypegeo = new jsn.jsnObjectTypegeo(objtypegeo);
                modifiedTypeGeos.push(jsnObjTypegeo);
            }
        } 
    }
    { // Handle relationship to parent ('Is' relationship)
        let parentType: akm.cxObjectType | null = null;
        if (objtype) {
            objtype.setModified();
            // const parentObjs = currentObj.getInheritanceObjects(myModel);
            // for (let i=0; i<parentObjs.length; i++) {
            //     const parentObj = parentObjs[i];
            //     parentType = myTargetMetamodel.findObjectType(parentObj.generatedTypeId);
            //     // Create Is relationship type to parent type
            //     parentRelType  = new akm.cxRelationshipType(utils.createGuid(), constants.types.AKM_IS, objtype, parentObjType, "");
            // }
            if (!parentType)
                parentType = currentObj.type as akm.cxObjectType;
            // Connect objtype to parentType
            // First check if it already exists
            if (!parentRelType)
                parentRelType = myTargetMetamodel.findRelationshipTypeByName2(constants.types.AKM_IS, objtype, parentType);
            if (!parentRelType) {
                // It does not exist, so create it
                parentRelType  = new akm.cxRelationshipType(utils.createGuid(), constants.types.AKM_IS, objtype, parentType, "");
                objtype.addOutputreltype(parentRelType);
                parentType.addInputreltype(parentRelType);
                parentRelType.setModified();
                parentRelType.setRelshipKind('Generalization');
                myTargetMetamodel.addRelationshipType(parentRelType);
                myMetis.addRelationshipType(parentRelType);
            }
            // Prepare for dispatch
            if (parentRelType) {
                const jsnRelshipType = new jsn.jsnRelationshipType(parentRelType, true);
                modifiedRelshipTypes.push(jsnRelshipType);
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
        for (let i=0; i<rels?.length; i++) {
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
        const typeprops = new Array();
        let props = getAllPropertytypes(currentObj, typeprops, myModel);
        addProperties(objtype, typeprops, context);
    
        // Handle properties
        //     objtype.properties = new Array();
        //     objtype.description = currentObj.description;
        //     const typeprops = new Array();
        //     getTypeProperties(object, typeprops, myModel);
        //     if (debug) console.log('255 objtype, object, typeprops', objtype, object, typeprops);
        //     addProperties(objtype, typeprops, context);
    }
    { // Handle ports
        const porttype = myMetis.findObjectTypeByName(constants.types.AKM_PORT);
        const ports = new Array();
        const rels = object.outputrels;
        for (let i=0; i<rels?.length; i++) {
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
    { // Prepare object type for dispatch
        const jsnObjectType = new jsn.jsnObjectType(objtype, true);
        modifiedObjectTypes.push(jsnObjectType);
    }
    { // Handle typeviews
        const typeview = objtype.typeview as akm.cxObjectTypeView;
        if (typeview) {
            const jsnObjTypeview = new jsn.jsnObjectTypeView(typeview);
            if (debug) console.log('278 typeview, jsnObjTypeview', typeview, jsnObjTypeview);
            modifiedObjectTypeViews.push(jsnObjTypeview);
        }
    }
    { // Handle type geos
        const geo = myTargetMetamodel.findObjtypeGeoByType(objtype);
        if (geo) {
            const jsnObjTypegeo = new jsn.jsnObjectTypegeo(geo);
            modifiedTypeGeos.push(jsnObjTypegeo);
        }
    }
    { // Do the dispatches
        modifiedObjectTypes.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPE_PROPERTIES', data })
        });
        modifiedTypeGeos?.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES', data })
        })
        modifiedObjectTypeViews?.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES', data })
        });
        modifiedRelshipTypes.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
        });
        modifiedObjects?.map(mn => {
            let data = (mn) && mn 
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
        });
        modifiedRelships?.map(mn => {
            let data = (mn) && mn 
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
        });
    }
    return objtype;
}

export function generateRelshipType(relship: akm.cxRelationship, relview: akm.cxRelationshipView, context: any) {
    if (debug) console.log('316 relship, relview: ', relship, relview);
    if (!relship) {
        return;
    }
    const myMetis           = context.myMetis;
    const myDiagram         = context.myDiagram;
    const myTargetMetamodel = context.myTargetMetamodel;

    if (debug) console.log('327 myTargetMetamodel', myTargetMetamodel);
    // relship is the relationship defining the relationship type to be generated
    const currentRel  = myMetis.findRelationship(relship.id);
    if (debug) console.log('330 currentRel: ', currentRel);
    // fromName is the relationship type name seen from the from object
    // toName is the relationship type name seen from the to object
    const names = currentRel.name.split("/");
    let fromName = names[0];
    let toName = "";
    if (names.length > 0) {
        toName   = names[1];
    }
    const fromObj  = currentRel?.getFromObject();
    let fromObjName = fromObj?.name;
    fromObjName = utils.camelize(fromObjName);
    fromObjName = utils.capitalizeFirstLetter(fromObjName);
    const fromtype = myTargetMetamodel?.findObjectTypeByName(fromObjName);
    const toObj    = currentRel?.getToObject();
    let toObjName = toObj?.name;
    toObjName = utils.camelize(toObjName);
    toObjName = utils.capitalizeFirstLetter(toObjName);
    const totype   = myTargetMetamodel?.findObjectTypeByName(toObjName);
    if (debug) console.log('341 fromObj, toObj: ', fromObj, toObj);
    if (debug) console.log('342 fromtype, totype, fromName, toName ', fromtype, totype, fromName, toName);
    // let newName  = currentRel?.getName();
    let newName = fromName;
    if (toName?.length > 0) newName = newName + "/" + toName;
    let oldName = "";
    // newName = utils.camelize(newName);
    // if (newName !== constants.types.AKM_IS)
    //     newName = utils.uncapitalizeFirstLetter(newName);
    let relname = newName;
    let reltype, reltypeview;
    let typeid = currentRel?.generatedTypeId;
    if (debug) console.log('345 currentRel, typeid, length, newName', currentRel, typeid, typeid.length, newName);
    if (typeid) // The type has been generated before
    {
        reltype = myMetis.findRelationshipType(typeid);  // The existing relationship type
        if (debug) console.log('349 reltype, myMetis: ', reltype, myMetis);    
        if (reltype) {
            // Eventually do a rename
            oldName = reltype?.getName();
            reltype.setName(newName);

// The following code fails due to that fromType and toType for some reason are unknown / undefined   
            if (false) {
                // Ensure that the reltype has the same from and to object types
                let fromType = reltype.fromObjtype;
                let toType = reltype.toObjtype;
                if (debug) console.log('357 reltype, fromType, toType: ', reltype, fromType, toType);    
                fromType = myMetis.findObjectType(fromType?.id);
                if (fromType) {
                    toType = myMetis.findObjectType(toType?.id);
                    if (!toType)
                        reltype = null;
                } else
                    reltype = null;
                if (debug) console.log('365 reltype, fromType, toType: ', reltype, fromType, toType);  
            } 
// End failing code             
        }
        if (debug) console.log('367 reltype: ', reltype);    
        if (reltype) {
            reltype.markedAsDeleted = relship.markedAsDeleted;
            myTargetMetamodel?.addRelationshipType(reltype);
        }
    } else // Check if the type has not been generated, but exists anyway
    {
        reltype = myMetis.findRelationshipTypeByName2(relname, fromtype, totype);
        if (reltype) {
            reltype.markedAsDeleted = relship.markedAsDeleted;
            myTargetMetamodel?.addRelationshipType(reltype);
            reltype.relshipkind = relship.relshipkind;
            reltype.cardinality = relship.cardinality;
        }
    }
    if (debug) console.log('385 reltype, relname, fromtype, totype: ', reltype, relname, fromtype, totype);
    if (!reltype) {
        if (relname && fromtype && totype) // This is a new relationship type
        {
            if (debug) console.log('384 relname, fromtype, totype: ', relname, fromtype, totype);
            reltype = new akm.cxRelationshipType(utils.createGuid(), relname, fromtype, totype, currentRel.description);
            if (reltype) {
                const names = relname.split("/");
                if (names.length > 1) {
                    reltype.nameFrom = names[0];
                    reltype.nameTo   = names[1];
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
            let props = currentRel.type?.getProperties(true);
            if (props !== undefined && props !== null && props.length > 0)
                reltype.properties = props;
            else
                reltype.properties = new Array();
            for (let i=0; i<props?.length; i++) {
                const prop = props[i];
                reltype.properties?.push(prop);
            }
        }
        myTargetMetamodel?.addRelationshipType(reltype);
        myMetis.addRelationshipType(reltype);
        currentRel.generatedTypeId = reltype.id;
        const jsnRelship = new jsn.jsnRelationship(currentRel);
        const data = JSON.parse(JSON.stringify(jsnRelship));
        myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })

        // Create/Modify the relationship typeview
        reltypeview = reltype.typeview;
        if (debug) console.log('421 reltype, typeview: ', reltype, reltype.typeview);    
        if (!reltypeview) {
            const guid = utils.createGuid();
            const name = reltype.name + '_' + reltype.getRelshipKind();
            reltypeview = new akm.cxRelationshipTypeView(guid, name, reltype, "");
            reltypeview.applyRelationshipViewParameters(relview);
            reltypeview.setRelshipKind(reltype.relshipkind);
            reltype.typeview = reltypeview;
            reltype.setModified();
            myTargetMetamodel?.addRelationshipTypeView(reltypeview);
            myMetis.addRelationshipTypeView(reltypeview);
            if (debug) console.log('432 reltype, reltypeview', reltype, reltypeview);
        } else {
            const name = reltype.name + '_' + reltype.getRelshipKind();
            reltypeview.name = name;
            reltypeview.applyRelationshipViewParameters(relview);
            reltypeview.setRelshipKind(reltype.relshipkind);
            reltype.setModified();
            myTargetMetamodel?.addRelationshipTypeView(reltypeview);
            myMetis.addRelationshipTypeView(reltypeview);
            if (debug) console.log('442 reltype, reltypeview', reltype, reltypeview);
        }
        if (debug) console.log('443 reltype, reltypeview, relview', reltype, reltypeview, relview);
        if (debug) console.log('444 relview, reltypeview', relview, reltypeview);
        if (debug) console.log('445 reltypeview', reltypeview);
    }
    if (debug) console.log('468 reltype', reltype);
    return reltype;
}

export function generateRelshipType2(object: akm.cxObject, fromType: akm.cxObjectType, toType: akm.cxObjectType, context: any) {
    if (!object) {
        return;
    }
    const myDiagram         = context.myDiagram;
    const myMetis           = context.myMetis;
    const myTargetMetamodel = context.myTargetMetamodel;
    const myModel           = context.myModel;
    const modifiedRelshipTypes = new Array();

    const relname = object.name;
    let reltype: akm.cxRelationshipType | null = null;
    if (relname === constants.types.AKM_RELATIONSHIP_TYPE) {
        const fromType = myMetis.findObjectTypeByName(constants.types.AKM_ENTITY_TYPE);
        const toType = fromType;
        reltype = myMetis.findRelationshipTypeByName2(relname, fromType, toType);
    } else {
        // Check if reltype exists in myMetis
        reltype = myMetis.findRelationshipTypeByName2(relname, fromType, toType);
        if (!reltype)
            reltype = new akm.cxRelationshipType(utils.createGuid(), relname, fromType, toType, object.description);
    }
    myTargetMetamodel?.addRelationshipType(reltype);
    myMetis.addRelationshipType(reltype);

    { // Handle properties
        const typeprops = new Array();
        getAllPropertytypes(object, typeprops, myModel);
        if (debug) console.log('435 typeprops, myMetis', typeprops, myMetis);
        addProperties(reltype, typeprops, context);
        if (debug) console.log('437 reltype', reltype);
        const jsnRelshipType = new jsn.jsnRelationshipType(reltype, true);
        if (debug) console.log('439 Generate Relationship Type', reltype, jsnRelshipType);
        modifiedRelshipTypes.push(jsnRelshipType);
        // Handle the relationship typeview
        let reltypeview = reltype.typeview;
        if (debug) console.log('421 reltype, typeview: ', reltype, reltype.typeview);    
        if (!reltypeview) {
            const guid = utils.createGuid();
            const name = reltype.name + '_' + reltype.getRelshipKind();
            reltypeview = new akm.cxRelationshipTypeView(guid, name, reltype, "");
            if (reltypeview) {
                reltype.typeview = reltypeview;
                myTargetMetamodel?.addRelationshipTypeView(reltypeview);
                myMetis.addRelationshipTypeView(reltypeview);
            }
            reltype.setModified();
        }
    }

    modifiedRelshipTypes?.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
    });

    return reltype;
}

export function generateDatatype(obj: akm.cxObject, context: any) {
    const myMetis  = context.myMetis;
    const myModel  = context.myModel;
    const myDiagram = context.myDiagram;
    const object   = myMetis.findObject(obj.id);
    const name     = object.name;
    const descr    = object.description;
    const myTargetMetamodel = context.myTargetMetamodel;
    if (!myTargetMetamodel)
        return null;
    let datatype   = myTargetMetamodel?.findDatatypeByName(name);
    if (!datatype) {
        if (debug) console.log('464 datatype name:', name);
        const dtype = myMetis.findDatatypeByName(name);
        if (debug) console.log('466 dtype:', dtype);
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
    if (debug) console.log('475 datatype', datatype, myTargetMetamodel);
    if (datatype) {
        // Handle all aspects of the datatype
        const rels = object.getOutputRelships(myModel, constants.relkinds.REL);
        if (rels) {
            if (debug) console.log('480 rels', rels);
            let values  = new Array();
            // Check if it has a parent datatype
            for (let i=0; i < rels.length; i++) {
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
            if (debug) console.log('500 rels', rels);
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
                    if (debug) console.log('511 rels', rels);
                }
                else if (rel.getName() === constants.types.AKM_IS_DEFAULTVALUE) {
                    let valueObj = rel.toObject;
                    if (valueObj) {
                        datatype.setDefaultValue(valueObj.name);
                        if (debug) console.log('516 defaultValue', valueObj.name);
                        values.push(valueObj.getName());
                    }
                }
                for (let i=0; i< values.length; i++) {
                    datatype.addAllowedValue(values[i]);
                    if (debug) console.log('520 allowedValue', values[i]);
                }
                if (values.length > 0) {
                    if (datatype.getFieldType() === 'text')
                        datatype.setFieldType('radio');
                }
            }
            for (let i=0; i < rels.length; i++) {
                let rel = rels[i];
                // Handle datatype reference
                if (rel.getName() === constants.types.AKM_IS_OF_DATATYPE) {
                    if (debug) console.log('609 rel', rel);
                    const toObj = rel.getToObject();
                    if (debug) console.log('611 toObj', toObj);
                    if (toObj.type.name === constants.types.AKM_DATATYPE) {
                        let dtypeObj = toObj;
                        let dtype = myMetis.findDatatypeByName(dtypeObj.name);
                        if (debug) console.log('613 dtype', dtype);
                        if (dtype) {
                            datatype.setIsOfDatatype(dtype);
                        }
                    }
                    if (debug) console.log('616 datatype', datatype);
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
                        if (valueObj.fieldType)
                            datatype.setFieldType(valueObj.fieldType);
                    }
                }
                // Add the datatype
                if (debug) console.log('551 datatype', datatype);
                myTargetMetamodel.addDatatype(datatype);
                // Update phData
                const jsnDatatype = new jsn.jsnDatatype(datatype);
                const modifiedDatatypes = new Array();
                modifiedDatatypes.push(jsnDatatype);
                if (debug) console.log('557 ui_generateTypes', jsnDatatype, modifiedDatatypes);
                modifiedDatatypes.map(mn => {
                    let data = (mn) && mn;
                    data = JSON.parse(JSON.stringify(data));
                    myDiagram.dispatch({ type: 'UPDATE_DATATYPE_PROPERTIES', data })
                });

                if (debug) console.log('564 generateDatatype', datatype, myMetis);
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
    const myMetis  = context.myMetis;
    const myModel  = context.myModel;
    const object   = myMetis.findObject(obj.id);
    const name     = object.name;
    const descr    = object.description;
    const myTargetMetamodel = context.myTargetMetamodel;
    if (!myTargetMetamodel)
        return null;
    let mtdtype   = myTargetMetamodel?.findMethodTypeByName(name);
    if (!mtdtype) {
        mtdtype = new akm.cxMethodType(utils.createGuid(), name, descr);
        myTargetMetamodel.addMethodType(mtdtype);
        myMetis.addMethodType(mtdtype);  
    } else {
        mtdtype.properties = new Array();
    }
    if (debug) console.log('593 mtdtype', mtdtype, myTargetMetamodel);
    if (mtdtype) {
        // Handle properties
        const typeprops = new Array();
        getAllPropertytypes(obj, typeprops, myModel);
        if (debug) console.log('598 typeprops, myMetis', typeprops, myMetis);
        addProperties(mtdtype, typeprops, context);
        return mtdtype;
    }
}

export function generateMethod(obj: akm.cxObject, context: any): akm.cxMethod {
    const myMetis  = context.myMetis;
    const myModel  = context.myModel;
    const myDiagram = context.myDiagram;
    const object   = myMetis.findObject(obj.id);
    const name     = object.name;
    const descr    = object.description;
    const myMetamodel = context.myMetamodel;
    const myTargetMetamodel = context.myTargetMetamodel;
    // let method   = myMetamodel?.findMethodByName(name);
    let method   = myTargetMetamodel?.findMethodByName(name);
    if (!method) {
        if (debug) console.log('695 method name:', name);
        method = myMetis.findMethodByName(name);
        if (!method) 
            method = new akm.cxMethod(utils.createGuid(), name, descr);
        // myMetamodel.addMethod(method);
        myTargetMetamodel.addMethod(method);
        myMetis.addMethod(method);  
        if (debug) console.log('702 method:', method);
    }
    const mtdtypename  = object.methodtype;
    const methodType = myMetamodel.findMethodTypeByName(mtdtypename);
    if (debug) console.log('706 methodType', methodType);
    if (method && methodType) {
        method.methodtype = methodType.name;
        const props = methodType.properties;
        for (let i=0; i<props?.length; i++) {
            const propname = props[i].name;
            method[propname] = object[propname];
        }
        if (debug) console.log('714 method', method);
    }      
    if (debug) console.log('717 method', method, myMetamodel);
    // Update phData
    const jsnMethod = new jsn.jsnMethod(method);
    if (methodType) {
        const props = methodType.properties;
        for (let i=0; i<props?.length; i++) {
            const propname = props[i].name;
            jsnMethod[propname] = method[propname];
        }
    }
    const modifiedMethods = new Array();
    modifiedMethods.push(jsnMethod);
    if (debug) console.log('729 jsnMethod, myMetis', jsnMethod, myMetis);
    modifiedMethods.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        if (debug) console.log('734 data', data);
        myDiagram.dispatch({ type: 'UPDATE_TARGETMETHOD_PROPERTIES', data })
    });
    if (debug) console.log('736 method, myMetis', method, myMetis);
    return method;
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

export function generateTargetMetamodel(obj: any, myMetis: akm.cxMetis, myDiagram: any) {
    const nodes = myDiagram.nodes;
    for (let it = nodes.iterator; it?.next();) {
        const node = it.value;
        const object = node.data.object;
        const objtype = node.data.objecttype;
        const modifiedMetamodels = new Array();
        if (objtype.name === constants.types.AKM_METAMODEL) {
            const mmname = object.name;
            const mmodel = myMetis.findMetamodelByName(mmname);
            if (!mmodel) {
                const metamodel = new akm.cxMetaModel(utils.createGuid(), mmname, object.description);
                myMetis.addMetamodel(metamodel);
                const jsnMetamodel = new jsn.jsnMetaModel(metamodel);
                modifiedMetamodels.push(jsnMetamodel);
            }
        }
        modifiedMetamodels.map(mn => {
            let data = mn;
            if (debug) console.log('40 data', data);
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data });
        });
    }
    
    if (confirm('Do you want to EXCLUDE system types?')) {
        myMetis.currentModel.includeSystemtypes = false;
    } else {
        myMetis.currentModel.includeSystemtypes = true;
    }
    const args = {
        "metamodel":    myMetis.currentTargetMetamodel, 
        "modelview":    myMetis.currentModelview, 
        "node":         myMetis.currentNode,
    }
    const context = {
        "myMetis":            myMetis,
        "myMetamodel":        myMetis.currentMetamodel,
        "myModel":            myMetis.currentModel,
        "myGoModel":          myMetis.gojsModel,
        "myCurrentModelview": myMetis.currentModelview,
        "myCurrentNode":      myMetis.currentNode,
        "myDiagram":          myDiagram,
        "case":               "Generate Target Metamodel",
        "title":              "Select Target Metamodel",
        "dispatch":           myDiagram.dispatch,
        "postOperation":      generateTargetMetamodel2,
        "args":               args
    }
    if (debug) console.log('753 context', context);
    askForTargetMetamodel(context);
}

export function askForTargetMetamodel(context: any) {
    const myMetis = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const myModelview = context.myMetis.currentModelview;
    const myDiagram = context.myDiagram;
    const modalContext = {
        what:           "selectDropdown",
        title:          context.title,
        case:           context.case,
        modelview:      myModelview,
        myDiagram:      myDiagram,
        context:        context,
    } 
    let mmlist = [];
    const objectviews = myModelview.objectviews;
    for (let i=0; i<objectviews.length; i++) {
        const objectview = objectviews[i] as akm.cxObjectView;
        const object = objectview.object as akm.cxObject;
        if (object?.type?.name === constants.types.AKM_METAMODEL) {
            const relviews = objectview.getInputRelviews();
            for (let j=0; j<relviews?.length; j++) {
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
        for (let i=0; i<metamodels.length; i++) {
            const mm = metamodels[i];
            if (!mm.id)
                continue;
            if (mm.name === constants.admin.AKM_ADMIN_MM)
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

export function generateTargetMetamodel2(context: any) {
    const sourcemodelview = buildTemporaryModelView(context);
    const args = context.args;
    const targetmetamodel = context.myTargetMetamodel;
    const sourcemodel = context.myModel;
    if (debug) console.log('899 metamodel, modelview, context', targetmetamodel, sourcemodelview, context);
    if (!targetmetamodel)
        return false;
    if (!sourcemodelview)
        return false;

    let mergeMetamodel = false;

    // if (confirm('Do you want to MERGE into (NOT CLEAR) the Target Metamodel?')) {
    //     mergeMetamodel = true;
    // }    
    // if (!mergeMetamodel) {
    //     targetmetamodel.clearContent();
    // }

    const myMetis = context.myMetis;
    let currentNode = context.myCurrentNode;
    let objectviews = sourcemodelview.objectviews;
    let relshipviews = sourcemodelview.relshipviews;
    generateMetamodel(objectviews, relshipviews, context);

    // Check if there already exists models based on the generated metamodel
    // const models = myMetis.getModelsByMetamodel()
    return true;
}

export function verifyPortsModel(objectviews: akm.cxObjectView[], relshipviews: akm.cxRelationshipView[]): boolean {
    for (let i=0; i<objectviews.length; i++) {
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
            for (let j=0; j<ports.length; j++) {
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
        const jsnRelTypeview = new jsn.jsnRelshipTypeView(reltypeview);
        modifiedRelTypeViews.push(jsnRelTypeview);
        myMetamodel.addRelationshipTypeView(reltypeview);
        let jsnMetamodel = new jsn.jsnMetaModel(myMetamodel, true);
        modifiedMetamodels.push(jsnMetamodel);
    }
    let hasSubType = myMetis.findRelationshipTypeByName1(constants.types.AKM_CONTAINS, mmType, mmType);
    if (hasSubType) {
        const reltypeview = hasSubType.typeview;
        const jsnRelTypeview = new jsn.jsnRelshipTypeView(reltypeview);
        modifiedRelTypeViews.push(jsnRelTypeview);
        myMetamodel.addRelationshipTypeView(reltypeview);
        let jsnMetamodel = new jsn.jsnMetaModel(myMetamodel, true);
        modifiedMetamodels.push(jsnMetamodel);
    }
    hasSubType = myMetis.findRelationshipTypeByName1(constants.types.AKM_CONTAINS, mmType, mType);
    if (hasSubType) {
        const reltypeview = hasSubType.typeview;
        const jsnRelTypeview = new jsn.jsnRelshipTypeView(reltypeview);
        modifiedRelTypeViews.push(jsnRelTypeview);
        myMetamodel.addRelationshipTypeView(reltypeview);
        let jsnMetamodel = new jsn.jsnMetaModel(myMetamodel, true);
        modifiedMetamodels.push(jsnMetamodel);
    }
    modifiedRelTypeViews?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
    });
    modifiedMetamodels.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data })
    });
    
}

function addSubAndContainRelviews(myMetis: akm.cxMetis, myModel: akm.cxModel, modelview: akm.cxModelView) {
    const modifiedRelshipViews = new Array();
    const mmType = myMetis.findObjectTypeByName(constants.types.AKM_METAMODEL);
    const mType = myMetis.findObjectTypeByName(constants.types.AKM_MODEL);
    const entType = myMetis.findObjectTypeByName(constants.types.AKM_ENTITY_TYPE);    
    const containsType = myMetis.findRelationshipTypeByName1(constants.types.AKM_CONTAINS, mmType, entType);
    if (containsType) {
        const rels = myModel.getRelationshipsByType(containsType, false);
        for (let i=0; i<rels?.length; i++) {
            const rel = rels[i];
            if (rel.markedAsDeleted) continue;
            addSubAndContainRelview(rel, modelview, modifiedRelshipViews);
        }
    }
    let hasSubType = myMetis.findRelationshipTypeByName1(constants.types.AKM_HAS_SUBMETAMODEL, mmType, mmType);
    if (hasSubType) {
        const rels = myModel.getRelationshipsByType(hasSubType, false);
        for (let i=0; i<rels?.length; i++) {
            const rel = rels[i];
            if (rel.markedAsDeleted) continue;
            addSubAndContainRelview(rel, modelview, modifiedRelshipViews);
        }
    }
    hasSubType = myMetis.findRelationshipTypeByName1(constants.types.AKM_HAS_SUBMETAMODEL, mmType, mType);
    if (hasSubType) {
        const rels = myModel.getRelationshipsByType(hasSubType, false);
        for (let i=0; i<rels?.length; i++) {
            const rel = rels[i];
            if (rel.markedAsDeleted) continue;
            addSubAndContainRelview(rel, modelview, modifiedRelshipViews);
        }
    }
    modifiedRelshipViews?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    });
}

function addSubAndContainRelview(relship: akm.cxRelationship, modelview: akm.cxModelView, modifiedRelshipViews: any[]   ) {
    const fromObj = relship.fromObject;
    const toObj = relship.toObject;
    const fromObjviews = modelview.findObjectViewsByObject(fromObj);
    const toObjviews = modelview.findObjectViewsByObject(toObj);
    if (fromObjviews.length>0 && toObjviews.length>0) {
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
        let jsnRelview = new jsn.jsnRelshipView(relview);
        modifiedRelshipViews.push(jsnRelview);                
    }

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

export function generateMetamodel(objectviews: akm.cxObjectView[], relshipviews: akm.cxRelationshipView[], context: any): akm.cxMetaModel {
    if (debug) console.log('965 objectviews, relshipviews, context', objectviews, relshipviews, context);
    const myMetis     = context.myMetis as akm.cxMetis;
    const myMetamodel = context.myMetamodel as akm.cxMetaModel;
    const model       = context.myModel as akm.cxModel;
    const myGoModel   = context.myGoModel;
    const myDiagram   = context.myDiagram;
    let targetMetamodel = context.myTargetMetamodel as akm.cxMetaModel;
    const modifiedMethods      = new Array();
    const modifiedMethodTypes  = new Array();
    const modifiedObjectTypes  = new Array();
    const modifiedObjTypeViews = new Array();
    const modifiedTypeGeos     = new Array();
    const modifiedRelshipTypes = new Array();
    const modifiedRelTypeViews = new Array();
    const modifiedMetamodels   = new Array();

    if (!targetMetamodel)
        return null;
    model.targetMetamodelRef = targetMetamodel.id;
    targetMetamodel.generatedFromModelRef = model.id;
    targetMetamodel.includeSystemtypes = false; 
    const mmname = targetMetamodel.name;

    let isCoreMetamodel = false;
    if (targetMetamodel.name === constants.core.AKM_CORE_MM)
        isCoreMetamodel = true;

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
    let objects = model?.getObjectsByTypename('Datatype', false);
    if (objects) {
        // For each Datatype object call generateDatatype
        for (let i=0; i<objects.length; i++) {
            let obj = objects[i];
            if (obj && !obj.markedAsDeleted)
                generateDatatype(obj, context);
        }
    }

    // Add existing method types to the new targetMetamodel
    const mtdtypes = myMetamodel.methodtypes;
    if (mtdtypes) {
        targetMetamodel.methodtypes = mtdtypes;
    }   
    // For each MethodType object call generateMethodType
    objects = model?.getObjectsByTypename('MethodType', false);
    if (objects) {
        for (let i=0; i<objects.length; i++) {
            let obj = objects[i];
            if (obj && !obj.markedAsDeleted) {
                let mtdType = targetMetamodel.findMethodTypeByName(obj.name);
                if (mtdType) {
                    const mtdId = mtdType.id;
                    mtdType.properties = [];
                    mtdType = generateMethodType(obj, context);
                    targetMetamodel.addMethodType(mtdType);
                    myMetis.addMethodType(mtdType);
                    const jsnMtdType = new jsn.jsnMethodType(mtdType);
                    modifiedMethodTypes.push(jsnMtdType);
                }
            }
        }
    }
    // For each Method object call generateMethod
    objects = model?.getObjectsByTypename('Method', false);
    if (objects) {
        if (debug) console.log('1316 methods', objects);
        for (let i=0; i<objects.length; i++) {
            let obj = objects[i];
            if (obj && !obj.markedAsDeleted) {
                const method = generateMethod(obj, context);
                const jsnMethod = new jsn.jsnMethod(method);
                if (debug) console.log('1322 method, jsnMethod', method, jsnMethod);
                const mtdtypename  = method.methodtype;
                const methodType = myMetamodel.findMethodTypeByName(mtdtypename);
                if (debug) console.log('1325 methodType', methodType);
                if (method && methodType) {
                    method.methodtype = methodType.name;
                    const props = methodType.properties;
                    for (let i=0; i<props?.length; i++) {
                        const propname = props[i].name;
                        jsnMethod[propname] = obj[propname];
                    }
                    if (debug) console.log('1334 method', method);
                }      
                modifiedMethods.push(jsnMethod);
                if (debug) console.log('1337 method, jsnMethod', method, jsnMethod);
            }
        }
    }
    // Add system datatypes
    let systemdtypes = ['cardinality', 'viewkind', 'relshipkind', 'fieldtype', 
                        'layout', 'routing', 'linkcurve',
                        'integer', 'string', 'number', 'boolean', 'date',
                        'reldir', 'actiontype'];
    let dtypes;
    if (model.includeSystemtypes) {
        dtypes = myMetamodel.datatypes;
    } else {
        dtypes = [];
        for (let i=0; i<systemdtypes.length; i++) {
            const dtypename = systemdtypes[i];
            const dtype = myMetamodel.findDatatypeByName(dtypename);
            dtypes.push(dtype);
        }
    }   
    for (let j=0; j<dtypes.length; j++) {
        const dtype = dtypes[j];
        if (dtype) targetMetamodel.addDatatype(dtype);
    }

    // Add system types - first object types
    // const systemtypes = ['Element', 'EntityType', 'RelshipType',  
    //                      'Generic', 'Container', 'Collection', 'Method'];
    // const systemtypes = ['Element', 'EntityType', 'Generic', 'Container'];
    let objtypes = [];
    let osystemtypes = myMetamodel.objecttypes;
    for (let i=0; i<osystemtypes.length; i++) {
        // Filter types not to be generated: 
        const otype = osystemtypes[i];
        if (isCoreObjectType(otype, isCoreMetamodel))
            continue;
        objtypes.push(otype);
    }
    
    // Add object types: 
    targetMetamodel.objecttypes = objtypes;
    targetMetamodel.objecttypes0 = [];
    if (debug) console.log('1192 objecttypes', objtypes);
    // Add system relationship types
    let reltypes = [];
    let osystemreltypes = myMetamodel.relshiptypes;
    for (let i=0; i<osystemreltypes.length; i++) {
        // Filter types not to be generated: 
        const reltype = osystemreltypes[i];
        // if (isCoreRelationshipType(osystemreltypes[i], isCoreMetamodel))
        //     continue;
        if (!isApplicationRelType(reltype, objtypes))
            continue;
        reltypes.push(reltype);
    }

    { // Add relship types
        targetMetamodel.relshiptypes = reltypes;
        targetMetamodel.relshiptypes0 = [];
    }
    // ---
    // Adding system types completed
    // ---
    let metaObject;
    {   // Add metamodel contents
        let model;
        let modelview;
        for (let i=0; i <= objectviews?.length; i++) {
            const objview = objectviews[i];
            if (!objview /*|| objview.markedAsDeleted*/) 
                continue;
            let obj = objview.object;
            if (!obj /*|| obj.markedAsDeleted*/) 
                continue;
            if (obj.isOfType('Metamodel')) {
                const fromType = obj.type;
                let toType = fromType;
                // Follow 'contains' relationships
                let containsType = myMetis.findRelationshipTypeByName1(constants.types.AKM_CONTAINS, fromType, toType);
                const containedObjects = getSubMetaModelObjects(obj, containsType);
                for (let i=0; i<containedObjects?.length; i++) {
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
                toType = myMetis.findObjectTypeByName(constants.types.AKM_METAMODEL);
                // Follow 'hasSubMetamodel' relationships
                containsType = myMetis.findRelationshipTypeByName1(constants.types.AKM_HAS_SUBMETAMODEL, fromType, toType);
                const submetaObjects = getSubMetaModelObjects(obj, containsType);
                for (let i=0; i<submetaObjects?.length; i++) {
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
                const submodelType = myMetis.findRelationshipTypeByName1(constants.types.AKM_HAS_SUBMODEL, fromType, toType);
                const submodelObjects = getSubModelObjects(obj, submodelType);
                for (let i=0; i<submodelObjects?.length; i++) {
                    const submodelObject = submodelObjects[i];
                    if (submodelObject) {
                        let model = myMetis.findModelByName(submodelObject.name);
                        if (!model) {
                            model = new akm.cxModel(utils.createGuid(), submodelObject.name, submodelObject.description);
                            myMetis.addModel(model);
                        }
                        if (model) {
                            targetMetamodel.addSubModel(model);
                        }
                    }
                }
            }
            if (debug) console.log('1288 context', context);
            if (obj.isOfType('Model')) {  // A group object of type Model
                addModelToMetamodel(targetMetamodel, obj, context);
            }
        }
    }
    const metaObjects = ['EntityType'];
    { // Add or generate objecttypes
        for (let i=0; i<metaObjects.length; i++) {
            const mObject = metaObjects[i];
            const mType = myMetamodel.findObjectTypeByName(mObject);
            if (mType) {
                metaObject = mObject;
                break;
            }
        }
        if (objectviews) {
            if (debug) console.log('1270 objectviews', objectviews);
            for (let i=0; i<objectviews.length; i++) {
                const objview = objectviews[i];
                if (!objview /*|| objview.markedAsDeleted*/) 
                    continue;
                let obj = objview.object;
                if (!obj /*|| obj.markedAsDeleted*/) 
                    continue;
                switch (obj.type.name) {
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
                        obj = myMetis.findObject(obj.id);
                        if (obj.isOfType('Property'))
                            continue;
                }
                const  typenames = []; 
                if (obj.name === obj.type.name)
                    typenames.push(obj.type.name);
                    typenames.push(metaObject);
                for (let i=0; i<typenames.length; i++) {
                    const type = myMetamodel.findObjectTypeByName(typenames[i]);
                    if (type && obj && obj.type) {
                        if (type.markedAsDeleted)
                            continue;
                        // Check if obj inherits one of the specified types - otherwise do not generate type
                        let objtype;
                        if (
                            (obj.type.name === metaObject)
                        ) {
                            objtype = generateObjectType(obj, objview, context);
                            if (objtype) targetMetamodel.addObjectType(objtype);
                            if (objtype && objtype.name !== constants.types.AKM_ENTITY_TYPE) {
                                targetMetamodel.addObjectType0(objtype);
                                // Check if there already is an Is relationship type between the object type and EntityType
                                const reltypes = targetMetamodel.relshiptypes;
                                let found = false;
                                for (let i=0; i<reltypes.length; i++) {
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
                                    const jsnRelshipType = new jsn.jsnRelationshipType(reltype, true);
                                    modifiedRelshipTypes.push(jsnRelshipType);
                                }
                            }
                            const typeview = objtype?.typeview;
                            if (typeview) {
                                targetMetamodel.addObjectTypeView(typeview); 
                                vstyle.addObjectTypeView(typeview);
                                targetMetamodel.addViewStyle(vstyle); 
                                const jsnObjTypeview = new jsn.jsnObjectTypeView(typeview);
                                modifiedObjTypeViews.push(jsnObjTypeview);
                            }
                            if (debug) console.log('1327 targetMetamodel ', targetMetamodel);                            
                            const jsnObjectType = new jsn.jsnObjectType(objtype);
                            modifiedObjectTypes.push(jsnObjectType);
                        }
                    }
                }
            }
        }
    }
    // Add or generate relationship types
    { // First handle relationships of type "relationshipType"
        if (relshipviews) {
            for (let i=0; i<relshipviews.length; i++) {
                const relview = relshipviews[i] as akm.cxRelationshipView;
                if (!relview) continue;
                const rel = relview.relship as akm.cxRelationship;
                if (debug) console.log('1427 rel.name', rel.name);
                if (rel.isSystemRel()) {
                    continue;
                }
                // if (isCoreRelationshipType(rel.type, isCoreMetamodel))
                //     continue;
                const fromObjview = relview.fromObjview as akm.cxObjectView;
                if (!fromObjview) continue;
                const fromObj = fromObjview?.object as akm.cxObject;
                const toObjview = relview.toObjview as akm.cxObjectView;
                if (!toObjview) continue;
                const toObj = toObjview?.object as akm.cxObject;
                if (rel.name === constants.types.AKM_IS) {
                    for (let j=0; j<objtypes.length; j++) {
                        const otype1 = objtypes[j];
                        if (fromObj?.id === otype1?.id) {
                            for (let k=0; k<objtypes.length; k++) {
                                const otype2 = objtypes[j];
                                if (toObj?.id === otype2?.id) 
                                    continue;
                            }
                        }
                    }
                }
                if (fromObj?.isOfSystemType(metaObject) && 
                    toObj?.isOfSystemType(metaObject)) {
                    let reltype = targetMetamodel.findRelationshipTypeByNames(rel.name, fromObj.name, toObj.name);
                    if (!reltype) {
                        reltype = generateRelshipType(rel, relview, context);
                    }                   
                    // Prepare dispatches
                    if (reltype) {
                        myMetis.addRelationshipType(reltype);
                        targetMetamodel.addRelationshipType(reltype);
                        if (reltype.name !== constants.types.AKM_RELSHIP_TYPE
                                          && reltype.name !== constants.types.AKM_IS) {
                            targetMetamodel.addRelationshipType0(reltype);
                        }
                        const relTypeview = reltype.typeview;
                        if (relTypeview) {
                            relTypeview.applyRelationshipViewParameters(relview);
                            myMetis.addRelationshipTypeView(relTypeview);
                            reltype.setDefaultTypeView(relTypeview);
                            const jsnRelTypeview = new jsn.jsnRelshipTypeView(relTypeview);
                            modifiedRelTypeViews.push(jsnRelTypeview);
                        }
                        const jsnRelshipType = new jsn.jsnRelationshipType(reltype, true);
                        modifiedRelshipTypes.push(jsnRelshipType);
                    }
                }
            }
        }
    }
    if (debug) console.log('1400 targetMetamodel ', targetMetamodel);
    { // Then handle objects of type "RelshipType"
        for (let i=0; i<objectviews?.length; i++) {
            const objview = objectviews[i];
            const obj = objview.object;
            if (!obj) 
                continue;
            const type = obj.type;
            if (type.name !== constants.types.AKM_RELSHIP_TYPE)
                continue;
            const rtypename = obj.name;
            // Find fromObject and toObject
            const rels = obj.getOutputRelships(model, constants.relkinds.REL);
            let fromObj, toObj, fromObjType, toObjType;
            for (let i=0; i<rels.length; i++) {
                const rel = rels[i];
                if (rel.type.name === 'from') {
                    fromObj = rel.toObject;
                    const typename = fromObj?.name;
                    fromObjType = targetMetamodel.findObjectTypeByName(typename);
                } else if (rel.type.name === 'to') {
                    toObj = rel.toObject;
                    const typename = toObj?.name;
                    toObjType = targetMetamodel.findObjectTypeByName(typename);
                }
            }
            // Check if relationship type already exists
            let reltype = myMetis.findRelationshipTypeByName1(rtypename, fromObjType, toObjType);
            if (!reltype) {
                // This is a new relationship type
                reltype = generateRelshipType2(obj, fromObjType, toObjType, context);
                if (debug) console.log('1432 reltype', reltype);
            }
            if (reltype) { 
                targetMetamodel.addRelationshipType(reltype);
                if (reltype.name !== constants.types.AKM_RELSHIP_TYPE
                    && reltype.name !== constants.types.AKM__IS
                )
                    targetMetamodel.addRelationshipType0(reltype);
                // Handle typeview
                const relTypeview = reltype.typeview as akm.cxRelationshipTypeView;
                if (relTypeview) {
                    targetMetamodel.addRelationshipTypeView(relTypeview); 
                    const jsnRelTypeview = new jsn.jsnRelshipTypeView(relTypeview);
                    modifiedRelTypeViews.push(jsnRelTypeview);
                }                        
                // Handle properties
                const typeprops = new Array();
                getTypeProperties(obj, typeprops, context);
                getAllPropertytypes(obj, typeprops, model);
                addProperties(reltype, typeprops, context);
                const jsnRelshipType = new jsn.jsnRelationshipType(reltype, true);
                modifiedRelshipTypes.push(jsnRelshipType);
            }        
        }
    }
    { // Then handle pointer datatypes (To Be Done)
    // objects = model?.getObjectsByTypename('Datatype', false);
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
        const rels = model?.getRelationshipsByTypeName(constants.types.AKM_IS, constants.relkinds.GEN);
        if (debug) console.log('1346 model, rels', model, rels);
        if (rels) {
            for (let i=0; i<rels.length; i++) {
                const rel = rels[i];
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
                            for (let i=0; i<reltypes.length; i++) {
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
    targetMetamodel.embedContainedMetamodels();
    targetMetamodel.includeInheritedReltypes = model.includeSystemtypes;
    myMetis.currentTargetMetamodel = targetMetamodel;
    myMetis.currentTargetModel = model;
    { // Remove duplicate relationship types
        const reltypes = targetMetamodel.relshiptypes;
        for (let j=0; j<reltypes?.length; j++) {
            const reltype = reltypes[j];
            for (let k=j+1; k<reltypes?.length; k++) {
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
        for (let j=0; j<reltypes?.length; j++) {
            const reltype = reltypes[j];
            targetMetamodel.addRelationshipType(reltype);
            myMetis.addRelationshipType(reltype);
            const jsnRelshipType = new jsn.jsnRelationshipType(reltype, true);
            modifiedRelshipTypes.push(jsnRelshipType);
        }
    }
    let jsnMetamodel = new jsn.jsnMetaModel(targetMetamodel, true);
    modifiedMetamodels.push(jsnMetamodel);
    myMetis.addMetamodel(targetMetamodel);

    // Do the dispatches
    modifiedMethods.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_METHOD_PROPERTIES', data })
    });
    modifiedMethodTypes.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_METHODTYPE_PROPERTIES', data })
    });

    modifiedObjectTypes.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPE_PROPERTIES', data })
    });
    modifiedObjTypeViews?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
    });
    modifiedTypeGeos?.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES', data })
    });
    modifiedRelshipTypes?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
    });
    modifiedRelTypeViews?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
    });

    addSubAndContainTypes(myMetis, myMetamodel);
    addSubAndContainRelviews(myMetis, context.myModel, context.myCurrentModelview);

    modifiedMetamodels.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data })
    });
    alert("The metamodel " + targetMetamodel.name + " has been successfully generated!");
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
        for (let i=0; i<reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(label, element, false);
        for (let i=0; i<reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(generic, element, false);
        for (let i=0; i<reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(container, element, false);
        for (let i=0; i<reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(entityType, element, false);
        for (let i=0; i<reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(entityType, entityType, false);
        for (let i=0; i<reltypes?.length; i++) {
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
    let relships = obj.getOutputRelshipsByType(containsType);
    for (let i=0; i<relships?.length; i++) {
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
    for (let i=0; i<relships?.length; i++) {
        const relship = relships[i];
        const target = relship.toObject;
        if (target.type.name === constants.types.AKM_METAMODEL) {
            myMetamodel.addSubMetamodel(target);
        }
    }
    // Handle relationships between the object types
    const objtypes = myMetamodel.objecttypes0;
    for (let i=0; i<objtypes?.length; i++) {
        const objtype = objtypes[i];
        const reltypes = objtype.getOutputReltypes();
        for (let j=0; j<reltypes?.length; j++) {
            const reltype = reltypes[j];
            if (reltype.name === constants.types.AKM_IS)
                continue;
                myMetamodel.addRelationshipType(reltype);
                myMetamodel.addRelationshipType0(reltype);
            }
    }
    // Handle relationships between the object types across sub-metamodels
    const objviews = myModelview?.objectviews;
    for (let i=0; i<objviews?.length; i++) {
        const fromObjview = objviews[i];
        const relviews = fromObjview.getOutputRelviews();
        for (let j=0; j<relviews?.length; j++) {
            const relview = relviews[j];
            const toObjview = relview.toObjview;
            for (let j=0; j<objviews?.length; j++) {
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
    for (let i=0; i<relships?.length; i++) {
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

function addModelToMetamodel(metamodel: akm.cxMetaModel, object: akm.cxObject, context:any) {
    // object represents the model
    const myMetis = context.myMetis as akm.cxMetis;
    const myDiagram = context.myDiagram;
    const subMetamodels = metamodel.submetamodels;   // e.g. IRTV metamodel
    const myModelview = context.myCurrentModelview;
    // Find the objectview of the object representing the model
    const objtype = object.type;
    let objectview;
    const objectviews = myModelview.objectviews;
    for (let i=0; i<objectviews?.length; i++) {
        const objview = objectviews[i];
        if (objview.object?.id === object.id) {
            objectview = objview;
            break;
        }
    }
    // Find submetamodel
    let subMetamodel = subMetamodels[0] as akm.cxMetaModel;
    for (let i=0; i<subMetamodels?.length; i++) {
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
        for (let i=0; i<objviews?.length; i++) {
            const member = objviews[i];
            const memberObj = member.object;
            if (memberObj) {
                model.addObject(memberObj);
                modelview.addObjectView(member);
            }
        }
        const relviews = myModelview.getRelshipviewsInGroup(group);
        for (let i=0; i<relviews?.length; i++) {
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
    myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
}

function buildTemporaryModelView(context: any): akm.cxModelView {
    const modelview = context.myCurrentModelview;
    const model = context.myModel;
    let objlist = [];
    let rellist = [];
    let objectviews = modelview.objectviews;
    for (let i=0; i<objectviews?.length; i++) {
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
    for (let i=0; i<relshipviews?.length; i++) {
        const relview = relshipviews[i];
        if (debug) console.log('830 relview', relview);
        const rel = relview.relship;
        if (rel) {
            rel.fromObject = relview.fromObjview.object;
            rel.toObject = relview.toObjview.object;
            rellist.push(rel);
        }
    }
    if (debug) console.log('841 rellist', rellist);
    uniquelist = [...new Set(rellist)];
    rellist = uniquelist;
    if (debug) console.log('844 objlist, rellist', objlist, rellist);
    // Build tempModelview
    const tempModelview = new akm.cxModelView(utils.createGuid(), '_TEMPVIEW', model, 'Temporary modelview');
    // First handle the objects
    for (let i=0; i<objlist.length; i++) {
        const obj = objlist[i];
        if (!obj) continue;
        const noObjviews = obj.objectviews?.length;
        let objview;
        if (noObjviews>0)
            objview = obj.objectviews[0];
        else
            objview = new akm.cxObjectView(utils.createGuid(), obj.name, obj, "");
        obj.addObjectView(objview);
        tempModelview.addObjectView(objview);
    }
    // Then handle the relationships
    for (let i=0; i<rellist.length; i++) {
        const rel = rellist[i];
        if (!rel) continue;
        const fromObj = rel.fromObject;
        const toObj   = rel.toObject;
        if (fromObj && toObj) { // changed
            const noRelviews = rel.relshipviews?.length;
            let relview;
            if (noRelviews>0) {
                relview = rel.relshipviews[0];
                relview.category = constants.gojs.C_RELSHIPVIEW;
                if (debug) console.log('862 relview', relview);
            } else {
                relview = new akm.cxRelationshipView(utils.createGuid(), rel.name, rel, "");
                if (debug) console.log('865 relview', relview);
            }
            const fromObjview = fromObj?.objectviews[0];
            const toObjview = toObj?.objectviews[0];
            relview.setFromObjectView(fromObjview);
            relview.setToObjectView(toObjview);
            tempModelview.addRelationshipView(relview);
            if (debug) console.log('877 relview', relview);
        }
    }
    if (debug) console.log('880 tempModelview', tempModelview);
    return tempModelview;
}

function addToObjAndRelLists(model: akm.cxModel, obj: akm.cxObject, objlist: any, rellist:any) {
    if (!obj) return;
    const relships = obj.getOutputRelships(model, constants.relkinds.GEN);
    if (relships?.length) {
        for (let i=0; i<relships?.length; i++) {
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

function getAllPropertytypes(obj: akm.cxObject, typeprops: any[], myModel: akm.cxModel): any[] {
    // Check if obj inherits another obj
    const genrels = obj?.getOutputRelships(myModel, constants.relkinds.GEN);
    if (genrels) {
        for (let i=0; i<genrels.length; i++) {
            const rel = genrels[i];
            const toObj = rel?.toObject as akm.cxObject;
            if (toObj) {
                if (debug) console.log('1162 toObj', toObj);
                getAllPropertytypes(toObj, typeprops, myModel);
            }
        }
    }
    return getTypeProperties(obj, typeprops, myModel);
}

function getTypeProperties(obj: akm.cxObject, typeprops: any[], myModel: akm.cxModel): any[] {
    const rels = obj?.getOutputRelships(myModel, constants.relkinds.REL);
    for (let i=0; i<rels?.length; i++) {
        const rel = rels[i];
        const toObj = rel?.getToObject();
        if (debug) console.log('1186 obj, rel, toObj', obj, rel, toObj);
        if (toObj.type?.name === constants.types.AKM_PROPERTY) {
            const proptype = rel?.getToObject();
            // Check if property type already exists
            for (let j=0; j<typeprops.length; j++) {
                if (proptype.name === typeprops[j].name)
                    continue;
            }
            if (debug) console.log('1194 proptype', proptype);
            typeprops.push(proptype);
        }
        if (rel?.type?.name === constants.types.AKM_HAS_COLLECTION) {
            if (toObj.type?.name === constants.types.AKM_COLLECTION) {
                const rels = toObj.outputrels;
                for (let j=0; j<rels?.length; j++) {
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
                for (let j=0; j<oviews.length; j++) {
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
        for (let i=0; i<genrels.length; i++) {
            const rel = genrels[i];
            const toObj = rel?.toObject as akm.cxObject;
            const type = toObj?.type;
            const props = type.properties;
            for (let j=0; j<props.length; j++) {
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
    for (let i=0; i<objects?.length; i++) {
        const obj = objects[i];
        if (obj?.type?.name !== constants.types.AKM_PROPERTY)
            continue;
        const objviews = obj?.objectviews;
        for (let j=0; j<objviews?.length; j++) {
            const objview = objviews[j];
            if (objview && objview.group === groupId) {
                typeprops.push(obj);
            }
        }
    }
    return typeprops;
}

function addProperties(type: akm.cxType | akm.cxMethodType, typeprops: any[], context: any) {
    const myMetis = context.myMetis;
    const myModel = context.myModel;
    const myTargetMetamodel = context.myTargetMetamodel;
    const myDiagram = context.myDiagram;
    // type.properties = [];
    for (let i=0; i < typeprops.length; i++) {
        // Check if property already exists
        let proptype = typeprops[i];
        const readOnly = proptype.readOnly;
        let prop = type.findPropertyByName(proptype.name);
        if (prop) 
            prop = myTargetMetamodel.findPropertyByName(prop.name);
        if (debug) console.log('1212 proptype, prop', proptype, prop);
        if (!prop) {
            // New property - create it
            prop = new akm.cxProperty(utils.createGuid(), proptype.name, proptype.description);
            let datatype = myMetis.findDatatypeByName("string");
            prop.setDatatype(datatype);
            type.addProperty(prop);
            myTargetMetamodel.addProperty(prop);
            myMetis.addProperty(prop);
            if (debug) console.log('1221 prop', prop);
        } else {
            prop.readOnly = readOnly;
            type.addProperty(prop);
            myTargetMetamodel.addProperty(prop);
            myMetis.addProperty(prop);
        }
        // }
        if (debug) console.log('1227 objtype, prop, targetMetamodel', type, prop, myTargetMetamodel);
        if (prop) {
            // const p = myMetis.findProperty(prop.id);
            // prop = p ? p : prop;
            // Find datatype connected to current property
            let rels = proptype.getOutputRelships(myModel, constants.relkinds.REL);
            if (debug) console.log('1233 rels', rels);
            if (prop && rels) {
                for (let i=0; i < rels.length; i++) {
                    let rel = rels[i];
                    if (!rel.markedAsDeleted) {
                        if (rel.name === constants.types.AKM_IS_OF_DATATYPE) {
                            let dtype = rel.toObject;
                            if (dtype) {
                                const datatype = myMetis.findDatatypeByName(dtype.name);
                                if (debug) console.log('1242 datatype', datatype);
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
                    if (debug) console.log('1256 property', prop);
                    type.addProperty(prop);
                    myTargetMetamodel?.addProperty(prop);
                    myMetis.addProperty(prop); 
                }                           
            }
            // Find method connected to current property
            rels = proptype.getOutputRelships(myModel, constants.relkinds.REL);
            if (debug) console.log('1264 rels', rels);
            if (prop && rels) {
                for (let i=0; i < rels.length; i++) {
                    let rel = rels[i];
                    if (!rel.markedAsDeleted) {
                        const reltype = rel.type;
                        if (reltype.name === constants.types.AKM_HAS_METHOD &&
                            rel.name === constants.types.AKM_HAS_METHOD) {
                            if (debug) console.log('1270 rel', rel);
                            const toObj = rel.toObject;
                            if (debug) console.log('1272 toObj', toObj);
                            if (toObj.type.name === constants.types.AKM_METHOD) {
                                if (debug) console.log('1274 mtdname', toObj.name);
                                const mtd = toObj;
                                if (mtd) {
                                    const method = myMetis.findMethodByName(mtd.name);
                                    if (debug) console.log('1277 method', method);
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
    if (debug) console.log('1290 type', type);
    // Do the dispatches
    const props = type?.properties;
    const modifiedProps = new Array();
    for (let i=0; i<props?.length; i++) {
        const jsnProperty = new jsn.jsnProperty(props[i]);
        if (debug) console.log('1296 prop, jsnProperty', props[i], jsnProperty);
        modifiedProps.push(jsnProperty);
    }
    if (modifiedProps?.length > 0) {
        modifiedProps.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_PROPERTY_PROPERTIES', data })
        });
        if (debug) console.log('1305 modifiedProps', modifiedProps);
    }
}

function isIRTVtype(objview: akm.cxObject) {}