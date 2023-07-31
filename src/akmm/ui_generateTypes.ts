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

export function generateObjectType(object: akm.cxObject, objview: akm.cxObjectView, context: any) { 
    if (debug) console.log('59 object, objview: ', object, objview);
    if (!object) {
        return;
    }
    const myDiagram   = context.myDiagram;
    const myMetis     = context.myMetis;
    const myTargetMetamodel = context.myTargetMetamodel;
    let typid = object.generatedTypeId;
    if (debug) console.log('67 typid', typid, typid.length);
    if (debug) console.log('68 myTargetMetamodel', myTargetMetamodel);
    const myMetamodel = myMetis.currentMetamodel;
    const myModel              = context.myModel;
    const myModelView          = context.myCurrentModelview;
    const modifiedObjects      = new Array();
    const modifiedObjectTypes  = new Array();
    const modifiedObjectTypeViews    = new Array();
    const modifiedRelships     = new Array();
    const modifiedRelshipTypes = new Array();
    const modifiedTypeGeos     = new Array();
    // 'object' is the object defining the object type to be generated
    const currentObj = myMetis.findObject(object.id) as akm.cxObject;
    let parentRelType: akm.cxRelationshipType | null = null;
    if (debug) console.log('76 object, currentObj, objview', object, currentObj, objview);
    if (debug) console.log('77 context', context);
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
            objtype.setViewKind(currentObj.getViewKind());
            objtype.setAbstract(currentObj.getAbstract());
            objtype.markedAsDeleted = object.markedAsDeleted;
            myTargetMetamodel?.addObjectType(objtype);
        }
    } else // Check if the types has not been generated, but exists anyway
    {        
        objtype = myMetis.findObjectTypeByName(currentObj.name);
        if (objtype) {
            objtype.setViewKind(currentObj.getViewKind());
            objtype.setAbstract(currentObj.getAbstract());
        }
        if (debug) console.log('102 obj, objtype', currentObj, objtype);
    }
    if (debug) console.log('104 newName', newName);
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
        if (debug) console.log('117 metaObjectName', metaObjectName);
        if (currentObj.type.name === metaObjectName 
            || currentObj.isOfSystemType(metaObjectName)
            ) {
            let name = objname;
            objtype = new akm.cxObjectType(utils.createGuid(), name, currentObj.description);
            { // Handle special attributes
                objtype.abstract = currentObj.abstract;
                objtype.viewkind = currentObj.viewkind;
            }
            { // Handle local inheritance
                const inheritanceObjects = currentObj.getInheritanceObjects(myModel);
                if (debug) console.log('124 inheritanceObjects', inheritanceObjects);
                for (let i=0; i<inheritanceObjects.length; i++) {
                    const inhObj = inheritanceObjects[i];
                    const inhObjType = myMetis.findObjectType(inhObj.generatedTypeId);
                    if (inhObjType) {
                        let parentRelType = myTargetMetamodel.findRelationshipTypeByName2(constants.types.AKM_IS, objtype, inhObjType);
                        if (debug) console.log('140 objtype, parentType, inhObjType', objtype, inhObjType, inhObjType);
                        if (!parentRelType) {
                            // Create 'Is' relationship type
                            parentRelType  = new akm.cxRelationshipType(utils.createGuid(), constants.types.AKM_IS, objtype, inhObjType, "");
                            objtype.addOutputreltype(parentRelType);
                            inhObjType.addInputreltype(parentRelType);
                            parentRelType.setModified();
                            parentRelType.setRelshipKind('Generalization');
                            myTargetMetamodel.addRelationshipType(parentRelType);
                            myMetis.addRelationshipType(parentRelType);
                            if (debug) console.log('149 objtype, inhObjType, parentRelType', objtype, inhObjType, parentRelType);
                        }
                    }
                }   
            }
            { // Handle the properties
                let properties = currentObj.type?.getProperties(true);
                if (properties !== undefined && properties !== null && properties.length > 0)
                    objtype.properties = properties;
                else
                    objtype.properties = new Array();
                const props = currentObj.getInheritedProperties(myModel);
                for (let i=0; i<props?.length; i++) {
                    const prop = props[i];
                    objtype.properties.push(prop);
                }
                // Handle attributes
                objtype.attributes = [];
                if (props && props.length) {
                    props.forEach(p => {
                        const prop = p as akm.cxProperty;
                        let attr = objtype.findAttributeByProperty(prop.id);
                        if (!attr) {
                            attr = new akm.cxAttribute(objtype, prop);
                            objtype.addAttribute(attr);
                        }
                    })
                }
            }
            myTargetMetamodel?.addObjectType(objtype);
            myMetis.addObjectType(objtype);
            object.generatedTypeId = objtype.getId();
            const jsnObject = new jsn.jsnObject(object);
            modifiedObjects.push(jsnObject);        
            if (debug) console.log('160 object, jsnObject: ', object, jsnObject);
            if (debug) console.log('161 objtype', objtype);
            { // Create objecttypeview
                const id = utils.createGuid();
                const objtypeview = new akm.cxObjectTypeView(id, objtype.name, objtype, currentObj.description);
                objtypeview.applyObjectViewParameters(objview);
                if (debug) console.log('138 objtype, objtypeview', objtype, objtypeview);
                objtype.typeview = objtypeview;
                objtype.setModified();
                myMetis.addObjectTypeView(objtypeview);
            }
            if (myTargetMetamodel) { // Handle type geos
                if (!myTargetMetamodel.objtypegeos) 
                    myTargetMetamodel.objtypegeos = new Array();
                const objtypegeo = new akm.cxObjtypeGeo(utils.createGuid(), myTargetMetamodel, objtype, "0 0", "100 50");
                myTargetMetamodel.addObjtypeGeo(objtypegeo);
                if (debug) console.log('177 myTargetMetamodel', myTargetMetamodel);
            } 
            if (debug) console.log('179 myMetis', myMetis);
            if (debug) console.log('180 objtype, myMetis', objtype, myMetis);
        }
    } else // Object type exists
    {
        objtype.setModified();
        const typeview = objtype.typeview as akm.cxObjectTypeView;
        if (debug) console.log('185 objview, typeview', objview, typeview);
        typeview?.applyObjectViewParameters(objview);
        if (debug) console.log('187 typeview', typeview);
    }
    if (!objtype) { // The object type has not been generated
        return null;
    }
    { // Handle relationship to parent ('Is' relationship)
        let parentType: akm.cxObjectType | null = null;
        if (objtype) {
            objtype.setModified();
            if (!parentType)
                parentType = currentObj.type;
            if (debug) console.log('198 myMetis', myMetis);
            // Connect objtype to parentType
            // First check if it already exists
            parentRelType = myTargetMetamodel.findRelationshipTypeByName2(constants.types.AKM_IS, objtype, parentType);
            if (debug) console.log('202 objtype, parentType, parentRelType', objtype, parentType, parentRelType);
            if (!parentRelType) {
                // It does not exist, so create it
                parentRelType  = new akm.cxRelationshipType(utils.createGuid(), constants.types.AKM_IS, objtype, parentType, "");
                objtype.addOutputreltype(parentRelType);
                parentType.addInputreltype(parentRelType);
                parentRelType.setModified();
                parentRelType.setRelshipKind('Generalization');
                myTargetMetamodel.addRelationshipType(parentRelType);
                myMetis.addRelationshipType(parentRelType);
                if (debug) console.log('211 objtype, parentType, parentRelType', objtype, parentType, parentRelType);
            }
            if (debug) console.log('213 objtype, parentType, parentRelType', objtype, parentType, parentRelType);
            if (debug) console.log('214 generateObjectType', myMetis);
            // Prepare for dispatch
            if (parentRelType) {
                const jsnRelshipType = new jsn.jsnRelationshipType(parentRelType, true);
                if (debug) console.log('218 Generate Relationship Type', parentRelType, jsnRelshipType);
                modifiedRelshipTypes.push(jsnRelshipType);
            }
        }
    }  
    if (debug) console.log('228 objtype, myTargetMetamodel', objtype, myTargetMetamodel);                                    // Then handle the object type
    if (debug) console.log('229 objtype, myMetis', objtype, myMetis);
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
        if (debug) console.log('250 objtype', objtype);
    }
    { // Handle properties
        objtype.properties = new Array();
        objtype.description = currentObj.description;
        const proptypes = new Array();
        getPropertyTypes(object, proptypes, myModel);
        if (debug) console.log('255 objtype, object, proptypes', objtype, object, proptypes);
        addProperties(objtype, proptypes, context);
        if (debug) console.log('257 objtype', objtype);
        // Prepare for dispatch
        const jsnObjectType = new jsn.jsnObjectType(objtype, true);
        if (debug) console.log('259 jsnObjectType', jsnObjectType);
        modifiedObjectTypes.push(jsnObjectType);
        if (debug) console.log('268 modifiedObjectTypes', modifiedObjectTypes, myMetis);
    }
    { // Handle ports
        const porttype = myMetis.findObjectTypeByName(constants.types.AKM_PORT);
        const ports = new Array();
        const rels = object.outputrels;
        if (debug) console.log('278 rels', rels);
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
                    if (debug) console.log('286 port', port);
                    ports.push(port);
                }
            }
        }
        if (ports) objtype.ports = ports;
        if (debug) console.log('306 objtype', objtype);
    }
    { // Handle typeviews
        const typeview = objtype.typeview as akm.cxObjectTypeView;
        if (typeview) {
            const jsnObjTypeview = new jsn.jsnObjectTypeView(typeview);
            if (debug) console.log('278 typeview, jsnObjTypeview', typeview, jsnObjTypeview);
            modifiedObjectTypeViews.push(jsnObjTypeview);
        }
        if (debug) console.log('286 modifiedObjectTypeViews', modifiedObjectTypeViews);
    }
    { // Handle type geos
        const geo = myTargetMetamodel.findObjtypeGeoByType(objtype);
        if (geo) {
            const jsnObjTypegeo = new jsn.jsnObjectTypegeo(geo);
            if (debug) console.log('288 Generate Object Type', jsnObjTypegeo, myMetis);
            modifiedTypeGeos.push(jsnObjTypegeo);
            if (debug) console.log('296 myMetis', modifiedTypeGeos, myMetis);
        }
    }
    // Do the dispatches
    modifiedObjectTypes.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        if (debug) console.log('265 ui-gen... data', data);
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
    if (debug) console.log('343 objtype', objtype);
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
                reltype.properties.push(prop);
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
    const reltype = new akm.cxRelationshipType(utils.createGuid(), relname, fromType, toType, object.description);
    myTargetMetamodel?.addRelationshipType(reltype);
    myMetis.addRelationshipType(reltype);

    { // Handle properties
        const proptypes = new Array();
        getAllPropertytypes(object, proptypes, myModel);
        if (debug) console.log('435 proptypes, myMetis', proptypes, myMetis);
        addProperties(reltype, proptypes, context);
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
                    if (debug) console.log('485 object, parentObj', object, parentObj);
                    const parentType = parentObj.type;
                    if (debug) console.log('487 parentType', parentType);
                    if (parentType.name === constants.types.AKM_DATATYPE) {
                        if (debug) console.log('489 rel', rel);
                        let parentDtype = myMetis.findDatatypeByName(parentObj.name);
                        if (debug) console.log('491 dtype', parentDtype);
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
                    datatype.setDefaultValue(valueObj.name);
                    if (debug) console.log('516 defaultValue', valueObj.name);
                    values.push(valueObj.getName());
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
                return datatype;
            }
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

export function generateMethodType(obj: akm.cxObject, context: any) {
    const myMetis  = context.myMetis;
    const myModel  = context.myModel;
    const myDiagram = context.myDiagram;
    const object   = myMetis.findObject(obj.id);
    const name     = object.name;
    const descr    = object.description;
    const myTargetMetamodel = context.myTargetMetamodel;
    if (!myTargetMetamodel)
        return null;
    let mtdtype   = myTargetMetamodel?.findMethodTypeByName(name);
    if (!mtdtype) {
        if (debug) console.log('582 mtdtype name:', name);
        const mtype = myMetis.findMethodTypeByName(name);
        if (debug) console.log('584 dtype:', mtype);
        if (mtype) {
            myTargetMetamodel.addMethodType(mtype);
        } else {
            mtdtype = new akm.cxMethodType(utils.createGuid(), name, descr);
            myTargetMetamodel.addMethodType(mtdtype);
            myMetis.addMethodType(mtdtype);  
        }      
    }
    if (debug) console.log('593 mtdtype', mtdtype, myTargetMetamodel);
    if (mtdtype) {
        // Handle properties
        const proptypes = new Array();
        getAllPropertytypes(obj, proptypes, myModel);
        if (debug) console.log('598 proptypes, myMetis', proptypes, myMetis);
        addProperties(mtdtype, proptypes, context);
        if (debug) console.log('600 mtdtype', mtdtype);
        const jsnMtdType = new jsn.jsnMethodType(mtdtype);
        if (debug) console.log('602 jsnMtdType', jsnMtdType);
        const modifiedObjectTypes = new Array();
        modifiedObjectTypes.push(jsnMtdType);
        modifiedObjectTypes.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_METHODTYPE_PROPERTIES', data })
        });
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
      const metamodels = myMetis.metamodels;
      let mmlist = [];
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
      if (debug) console.log('724', mmlist, modalContext, context);
      myDiagram.handleOpenModal(mmlist, modalContext);
}

export function generateTargetMetamodel2(context: any) {
    if (debug) console.log('893 context', context);
    const sourcemodelview = buildTemporaryModelView(context);
    if (debug) console.log('895 sourcemodelview', sourcemodelview);
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
    if (debug) console.log('740 myMetis', myMetis);
    let objectviews = sourcemodelview.objectviews;
    let relshipviews = sourcemodelview.relshipviews;
    if (currentNode) {
        if (debug) console.log('744 currentNode, myGoModel', currentNode, context.myGoModel);
        currentNode = context.myGoModel.findNode(currentNode.key);
        objectviews = currentNode?.getGroupMembers2(context.myGoModel);
        relshipviews = currentNode?.getGroupLinkMembers2(context.myGoModel);
    }
    if (debug) console.log('749 objviews, relviews', objectviews, relshipviews, context);
    generateMetamodel(objectviews, relshipviews, context);
    if (debug) console.log('785 myMetis', myMetis);

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

export function generateMetamodel(objectviews: akm.cxObjectView[], relshipviews: akm.cxRelationshipView[], context: any): akm.cxMetaModel {
    if (debug) console.log('965 objectviews, relshipviews, context', objectviews, relshipviews, context);
    const myMetis     = context.myMetis as akm.cxMetis;
    const myMetamodel = context.myMetamodel as akm.cxMetaModel;
    const model       = context.myModel as akm.cxModel;
    const targetMetamodel = context.myTargetMetamodel as akm.cxMetaModel;
    const myDiagram   = context.myDiagram;
    const modifiedMethods      = new Array();
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
            if (obj && !obj.markedAsDeleted)
                generateMethodType(obj, context);
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
    let dsystemtypes = ['Datatype', 'Value', 'FieldType', 'InputPattern', 'ViewFormat'];
    let objtypes;
    if (model.includeSystemtypes) {
        objtypes = myMetamodel.objecttypes;
        targetMetamodel.includeInheritedReltypes = true;
    } else {
        let osystemtypes = ['Information', 'Role', 'Task', 'View', 'Element', 'EntityType', 'Generic', 'Container', 'Label'];
        objtypes = [];
        for (let i=0; i<osystemtypes.length; i++) {
            let typename = osystemtypes[i];
            let otype = myMetis.findObjectTypeByName(typename);
            // Filter types not to be generated: 
            if (otype) {
                if (utils.nameExistsInNames(dsystemtypes, typename))
                    continue;
                if (otype.isOfType('Property'))
                    continue;
                if (otype.isOfType('Port'))
                    continue;
                if (otype.isOfType('Method'))
                    continue;
                if (otype.isOfType('MethodType'))
                    continue;
                if (otype.isOfType('RelshipType'))
                    continue;
                // End filtering                
                objtypes.push(otype);
            }
        }
    }
    // Add system object types: 
    if (debug) console.log('1192 objecttypes', objtypes);
    for (let i=0; i<objtypes.length; i++) {
        const typename = objtypes[i]?.name;
        const objtype = myMetamodel.findObjectTypeByName(typename);
        if (debug) console.log('1196 typename, objtype', typename, objtype);
        if (objtype) {
            targetMetamodel.addObjectTypeByName(objtype);
            targetMetamodel.addObjectTypeView(objtype.typeview as akm.cxObjectTypeView);
            let geo = new akm.cxObjtypeGeo(utils.createGuid(), targetMetamodel, objtype, "", "");
            targetMetamodel.addObjtypeGeo(geo);
            const jsnObjTypegeo = new jsn.jsnObjectTypegeo(geo);
            modifiedTypeGeos.push(jsnObjTypegeo);
        }
    }
    if (debug) console.log('1098 objtypes, targetMetamodel', objtypes, targetMetamodel);
    // Add system relationship types
    let reltypes;
    if (model.includeSystemtypes) {
        reltypes = myMetamodel.relshiptypes;
        if (debug) console.log('1092 reltypes', reltypes);
    } else {
        if (debug) console.log('1105 reltypes', myMetamodel.relshiptypes);
        reltypes = [];
        const rtypes = myMetamodel.relshiptypes;
        for (let i=0; i<rtypes.length; i++) {
            let rtype = rtypes[i];
            rtype = myMetis.findRelationshipType(rtype.id);
            rtype.fixObjectTypeRefs; // If needed
            // Filter types not to be generated
            const fromtype = rtype.fromObjtype;
            const totype = rtype.toObjtype;
            const objtypes = targetMetamodel.objecttypes;
            let found1 = false;
            let found2 = false;
            for (let j=0; j<objtypes?.length; j++) {
                const objtype = objtypes[j];
                if (objtype.id === fromtype.id) 
                    found1 = true;
                if (objtype.id === totype.id)
                    found2 = true;
            }
            if (found1 && found2) { // Both from and to object types are in the target metamodel
                reltypes.push(rtype); // Then include the relationship type
                if (debug) console.log('1120 rtype, rtype.name, fromtype, totype', rtype, rtype.name, fromtype, totype);
            }
        }
    }
    { // Add system relship types
        if (debug) console.log('1125 reltypes', reltypes);
        for (let i=0; i<reltypes.length; i++) {
            const reltype = reltypes[i];
            if (reltype) {
                targetMetamodel.addRelationshipType(reltype);
                if (reltype.typeview)
                    targetMetamodel.addRelationshipTypeView(reltype.typeview as akm.cxRelationshipTypeView);
                if (debug) console.log('1130 targetMetamodel, reltype', targetMetamodel, reltype);
            }
        }
        if (debug) console.log('1133 reltypes, targetMetamodel', reltypes, targetMetamodel);
        if (debug) console.log('1134 system relship types completed', myMetis);
    }
    // ---
    // Adding system types completed
    // ---
    let metaObject;
    { // Add or generate objecttypes
        const metaObjects = ['EntityType'];
        // const metaObjects = ['Role', 'Task', 'View', 'Information'];
        for (let i=0; i<metaObjects.length; i++) {
            const mObject = metaObjects[i];
            const mType = myMetamodel.findObjectTypeByName(mObject);
            if (mType) {
                metaObject = mObject;
                break;
            }
        }
        if (debug) console.log('1268 metaObject, objectviews', metaObject, objectviews);
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
                    case 'Property':
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
                if (debug) console.log('1299 typenames', typenames);
                for (let i=0; i<typenames.length; i++) {
                    if (debug) console.log('1301 i, obj, type', i, obj, typenames[i]);
                    const type = myMetamodel.findObjectTypeByName(typenames[i]);
                    if (debug) console.log('1303 type, obj', type, obj);
                    if (type && obj && obj.type) {
                        if (type.markedAsDeleted)
                            continue;
                        // Check if obj inherits one of the specified types - otherwise do not generate type
                        let objtype;
                        if (
                            // (obj.type.inherits(type, type.allRelationshiptypes))
                            // ||
                            // (obj.isOfSystemType(metaObject))
                            (obj.type.name === metaObject)
                        ) {
                            if (debug) console.log('1315 obj', obj.name, obj);
                            if (debug) console.log('1316 obj, objview', obj, objview);                               
                            objtype = generateObjectType(obj, objview, context);
                            if (debug) console.log('1318 objtype', objtype);   
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
        if (debug) console.log('1333 targetMetamodel ', targetMetamodel);
    }
    // Add or generate relationship types
    { // First handle relationships of type "relationshipType"
        if (relshipviews) {
            if (debug) console.log('1338 relshipviews', relshipviews);
            for (let i=0; i<relshipviews.length; i++) {
                const relview = relshipviews[i];
                if (debug) console.log('1341 relview', relview);
                if (!relview) continue;
                const rel = relview.relship;
                if (rel.isSystemRel()) {
                    if (debug) console.log('1345 rel', rel);
                    continue;
                }
                const fromObjview = relview.fromObjview;
                if (!fromObjview) continue;
                const fromObj = fromObjview?.object;
                const toObjview = relview.toObjview;
                if (!toObjview) continue;
                const toObj = toObjview?.object;
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
                if (debug) console.log('1366 fromObj, toObj', fromObj, toObj);
                if (fromObj?.isOfSystemType(metaObject) && 
                    toObj?.isOfSystemType(metaObject)) {
                    let reltype = targetMetamodel.findRelationshipTypeByNames(rel.name, fromObj.name, toObj.name);
                    if (!reltype) {
                        reltype = generateRelshipType(rel, relview, context);
                        if (debug) console.log('1378 rel, generated.reltype, typeview', rel.name, reltype, reltype?.typeview); 
                    }                   
                    // Prepare dispatches
                    if (reltype) {
                        myMetis.addRelationshipType(reltype);
                        targetMetamodel.addRelationshipType(reltype);
                        if (reltype.name !== constants.types.AKM_RELSHIP_TYPE
                                          && reltype.name !== constants.types.AKM_IS) {
                            targetMetamodel.addRelationshipType0(reltype);
                        }
                        if (debug) console.log('1385 Generate Relationship Type', reltype, jsnRelshipType);
                        const relTypeview = reltype.typeview;
                        if (relTypeview) {
                            relTypeview.applyRelationshipViewParameters(relview);
                            myMetis.addRelationshipTypeView(relTypeview);
                            reltype.setDefaultTypeView(relTypeview);
                            const jsnRelTypeview = new jsn.jsnRelshipTypeView(relTypeview);
                            if (debug) console.log('1392 Generate Reltypeview', jsnRelTypeview);
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
            if (type.name !== 'RelshipType')
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
            if (debug) console.log('1426 rtypename, fromObjType, toObjType', rtypename, fromObjType, toObjType);
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
                    if (debug) console.log('1443 Generate Reltypeview', jsnRelTypeview);
                    modifiedRelTypeViews.push(jsnRelTypeview);
                }                        
                // Handle properties
                const proptypes = new Array();
                getPropertyTypes(obj, proptypes, context);
                getAllPropertytypes(obj, proptypes, model);
                if (debug) console.log('1452 proptypes, myMetis', proptypes, myMetis);
                addProperties(reltype, proptypes, context);
                if (debug) console.log('1454 reltype', reltype);
                const jsnRelshipType = new jsn.jsnRelationshipType(reltype, true);
                if (debug) console.log('1456 Generate Relationship Type', reltype, jsnRelshipType);
                modifiedRelshipTypes.push(jsnRelshipType);
            }        
        }
    }
    { // Finally, handle pointer datatypes (To Be Done)
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
    const jsnMetamodel = new jsn.jsnMetaModel(targetMetamodel, true);
    modifiedMetamodels.push(jsnMetamodel);
    myMetis.addMetamodel(targetMetamodel);

    // Do the dispatches
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
    modifiedMetamodels.map(mn => {
    let data = mn;
    data = JSON.parse(JSON.stringify(data));
    myMetis.myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data })
    });
    alert("Target targetMetamodel has been successfully generated!");
    return targetMetamodel;
}

export function configureMetamodel(object: akm.cxObject, myMetis: akm.cxMetis, myDiagram: any) {
    const name = object.name;
    let myMetamodel = myMetis.findMetamodelByName(name);
    let entityType = null;
    if (!myMetamodel) {
        myMetamodel = new akm.cxMetaModel(utils.createGuid(), object.name, object.description);
        myMetis.addMetamodel(myMetamodel);
        // Add inherited object types
        const element = myMetis.findObjectTypeByName(constants.types.AKM_ELEMENT);
        myMetamodel.addObjectType(element);
        const container = myMetis.findObjectTypeByName(constants.types.AKM_CONTAINER);
        myMetamodel.addObjectType(container);
        const generic = myMetis.findObjectTypeByName(constants.types.AKM_GENERIC);
        myMetamodel.addObjectType(generic);
        const label = myMetis.findObjectTypeByName(constants.types.AKM_LABEL);
        myMetamodel.addObjectType(label);
        entityType = myMetis.findObjectTypeByName(constants.types.AKM_ENTITY_TYPE);
        myMetamodel.addObjectType(entityType);
        // Add inherited relationship types
        let reltypes = myMetis.findRelationshipTypesBetweenTypes1(element, element);
        for (let i=0; i<reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(label, element);
        for (let i=0; i<reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(generic, element);
        for (let i=0; i<reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(container, element);
        for (let i=0; i<reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(entityType, element);
        for (let i=0; i<reltypes?.length; i++) {
            const reltype = reltypes[i];
            myMetamodel.addRelationshipType(reltype);
        }
        reltypes = myMetis.findRelationshipTypesBetweenTypes1(entityType, entityType);
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
    const obj = myMetis.findObject(object.id);
    // Handle contains relationships
    const relships = obj.getOutputRelshipsByType(containsType);
    for (let i=0; i<relships?.length; i++) {
        const relship = relships[i];
        const target = relship.toObject;
        if (target.type.name === constants.types.AKM_METAMODEL) {
            configureMetamodel(target, myMetis, myDiagram);
            myMetamodel.addMetamodel(target);
        }
        const targetObjectType = myMetis.findObjectTypeByName(target.name);
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
            const subMetamodel = myMetis.findMetamodelByName(target.name);
            myMetamodel.addMetamodel(subMetamodel);
        }
        myMetamodel.embedSubMetamodels();
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

function getAllPropertytypes(obj: akm.cxObject, proptypes: any[], myModel: akm.cxModel): any[] {
    // Check if obj inherits another obj
    const genrels = obj?.getOutputRelships(myModel, constants.relkinds.GEN);
    if (genrels) {
        for (let i=0; i<genrels.length; i++) {
            const rel = genrels[i];
            const toObj = rel?.toObject as akm.cxObject;
            if (toObj) {
                if (debug) console.log('1162 toObj', toObj);
                getAllPropertytypes(toObj, proptypes, myModel);
            }
        }
    }
    getPropertyTypes(obj, proptypes, myModel);
}

function getPropertyTypes(obj: akm.cxObject, proptypes: any[], myModel: akm.cxModel): any[] {
    const rels = obj?.getOutputRelships(myModel, constants.relkinds.REL);
    for (let i=0; i<rels?.length; i++) {
        const rel = rels[i];
        const toObj = rel?.getToObject();
        if (debug) console.log('1186 obj, rel, toObj', obj, rel, toObj);
        if (toObj.type?.name === constants.types.AKM_PROPERTY) {
            const proptype = rel?.getToObject();
            // Check if property type already exists
            for (let j=0; j<proptypes.length; j++) {
                if (proptype.name === proptypes[j].name)
                    continue;
            }
            if (debug) console.log('1194 proptype', proptype);
            proptypes.push(proptype);
        }
        if (rel?.type?.name === constants.types.AKM_HAS_COLLECTION) {
            if (toObj.type?.name === constants.types.AKM_COLLECTION) {
                const rels = toObj.outputrels;
                for (let j=0; j<rels?.length; j++) {
                    const rel = rels[j];
                    if (rel?.type?.name === constants.types.AKM_CONTAINS) {
                        const o = rel.toObject;
                        if (o?.type?.name === constants.types.AKM_PROPERTY)
                            proptypes.push(o);
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
                    getPropertiesInGroup(grpId, proptypes, myModel);
                }
            }
        }
    }    
    return proptypes;
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

function getPropertiesInGroup(groupId: string, proptypes: any[], myModel: akm.cxModel): any[] {
    const objects = myModel.getObjects();
    for (let i=0; i<objects?.length; i++) {
        const obj = objects[i];
        if (obj?.type?.name !== constants.types.AKM_PROPERTY)
            continue;
        const objviews = obj?.objectviews;
        for (let j=0; j<objviews?.length; j++) {
            const objview = objviews[j];
            if (objview && objview.group === groupId) {
                proptypes.push(obj);
            }
        }
    }
    return proptypes;
}

function addProperties(type: akm.cxType | akm.cxMethodType, proptypes: any[], context: any) {
    const myMetis = context.myMetis;
    const myModel = context.myModel;
    const myTargetMetamodel = context.myTargetMetamodel;
    const myDiagram = context.myDiagram;
    type.properties = [];
    for (let i=0; i < proptypes.length; i++) {
        // Check if property already exists
        let proptype = proptypes[i];
        let prop = type.findPropertyByName(proptype.name);
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
            prop = myMetis.findProperty(prop.id);
            type.addProperty(prop);
        }
        // }
        if (debug) console.log('1227 objtype, prop, targetMetamodel', type, prop, myTargetMetamodel);
        if (prop) {
            const p = myMetis.findProperty(prop.id);
            prop = p ? p : prop;
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