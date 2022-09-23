// @ts-nocheck
const debug = false;

import * as utils from './utilities';
import * as akm from './metamodeller';
import * as gjs from './ui_gojs';
import * as jsn from './ui_json';
import { setMyGoModel } from '../actions/actions';
import { FaObjectUngroup } from 'react-icons/fa';
import { createRelationshipType } from './ui_common';
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
    const myModel     = context.myModel;
    const modifiedObjects = new Array();
    const modifiedTypeViews = new Array();
    // 'object' is the object defining the object type to be generated
    const currentObj = myMetis.findObject(object.id) as akm.cxObject;
    let parentRelType: akm.cxRelationshipType | null = null;
    if (debug) console.log('65 object, objview', object, objview);
    if (debug) console.log('69 context', context);
    let newName  = object?.name;
    let oldName = "";
    newName = utils.camelize(newName);
    newName = utils.capitalizeFirstLetter(newName);
    let objname = newName;
    if (debug) console.log('78 newName', newName);
    let objtype: akm.cxObjectType;
    if (typid) { // The object type exists - has been generated before
        objtype = myMetis.findObjectType(typid);
        if (objtype) {
            oldName = objtype.getName();
            objtype.setName(newName);
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
        if (debug) console.log('97 obj, objtype', currentObj, objtype);
    }
    if (debug) console.log('99 newName', newName);
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
        if (debug) console.log('112 metaObjectName', metaObjectName);
        if (currentObj.type.name === metaObjectName 
            || currentObj.isOfSystemType(metaObjectName)
            ) {
            let name = objname;
            // Handle local inheritance
            const inheritanceObjects = currentObj.getInheritanceObjects(myModel);
            if (debug) console.log('116 inheritanceObjects', inheritanceObjects);

            objtype = new akm.cxObjectType(utils.createGuid(), name, currentObj.description);
            { // Handle special attributes
                objtype.abstract = currentObj.abstract;
                objtype.viewkind = currentObj.viewkind;
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
            if (debug) console.log('132 object, jsnObject: ', object, jsnObject);
            if (debug) console.log('133 objtype', objtype);
            { // Create objecttypeview
                const id = utils.createGuid();
                const objtypeview = new akm.cxObjectTypeView(id, id, objtype, currentObj.description);
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
                myMetis.addObjtypeGeo(objtypegeo);
                myTargetMetamodel.addObjtypeGeo(objtypegeo);
                if (debug) console.log('149 myTargetMetamodel', myTargetMetamodel);
            } 
            if (debug) console.log('151 myMetis', myMetis);
            if (debug) console.log('152 objtype, myMetis', objtype, myMetis);
        }
    } else // Object type exists
    {
        const typeview = objtype.typeview as akm.cxObjectTypeView;
        if (debug) console.log('190 objview, typeview', objview, typeview);
        typeview?.applyObjectViewParameters(objview);
        if (debug) console.log('192 typeview', typeview);
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
            if (parentRelType) {
                const modifiedTypeLinks = new Array();
                const jsnRelshipType = new jsn.jsnRelationshipType(parentRelType, true);
                if (debug) console.log('216 Generate Relationship Type', parentRelType, jsnRelshipType);
                modifiedTypeLinks.push(jsnRelshipType);
                modifiedTypeLinks.map(mn => {
                    let data = (mn) && mn;
                    data = JSON.parse(JSON.stringify(data));
                    myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
                });
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
        const proptypes = new Array();
        getPropertyTypes(object, proptypes, myModel);
        if (debug) console.log('254 objtype, object, proptypes', objtype, object, proptypes);
        addProperties(objtype, proptypes, context);
        if (debug) console.log('256 objtype', objtype);
        const jsnObjectType = new jsn.jsnObjectType(objtype, true);
        if (debug) console.log('266 jsnObjectType', jsnObjectType);
        const modifiedTypeNodes = new Array();
        modifiedTypeNodes.push(jsnObjectType);
        modifiedTypeNodes.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            if (debug) console.log('271 ui-gen... data', data);
            myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPE_PROPERTIES', data })
        });
        if (debug) console.log('239 modifiedTypeNodes', modifiedTypeNodes, myMetis);
    }
    { // Handle typeviews
        const typeview = objtype.typeview as akm.cxObjectTypeView;
        if (objtype.typeview) {
            const jsnObjTypeview = new jsn.jsnObjectTypeView(typeview);
            if (debug) console.log('245 typeview, jsnObjTypeview', typeview, jsnObjTypeview);
            modifiedTypeViews.push(jsnObjTypeview);
            modifiedTypeViews?.map(mn => {
                let data = (mn) && mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES', data })
            });
            if (debug) console.log('252 modifiedTypeViews', modifiedTypeViews);
        }
    }
    { // Handle type geos
        const geo = myTargetMetamodel.findObjtypeGeoByType(objtype);
        if (geo) {
            const jsnObjTypegeo = new jsn.jsnObjectTypegeo(geo);
            if (debug) console.log('259 Generate Object Type', jsnObjTypegeo, myMetis);
            const modifiedGeos = new Array();
            modifiedGeos.push(jsnObjTypegeo);
            modifiedGeos?.map(mn => {
                let data = (mn) && mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES', data })
            })
            if (debug) console.log('267 myMetis', modifiedGeos, myMetis);
        }
    }

    modifiedObjects?.map(mn => {
        let data = (mn) && mn 
        if (debug) console.log('266 data', data);
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
        })
    if (debug) console.log('270 objtype', objtype);
    return objtype;
}

export function generateRelshipType(relship: akm.cxRelationship, relview: akm.cxRelationshipView, context: any) {
    if (debug) console.log('316 relship, relview: ', relship, relview);
    if (!relship) {
        return;
    }
    const modifiedTypeLinks = new Array();
    const modifiedTypeViews = new Array();
    const modifiedRelships  = new Array();
    const myDiagram         = context.myDiagram;
    const myMetis           = context.myMetis;
    const myTargetMetamodel = context.myTargetMetamodel;

    if (debug) console.log('327 myTargetMetamodel', myTargetMetamodel);
    // relship is the relationship defining the relationship type to be generated
    const currentRel  = myMetis.findRelationship(relship.id);
    if (debug) console.log('330 currentRel: ', currentRel);
    const fromObj  = currentRel?.getFromObject();
    let fromName = fromObj?.name;
    fromName = utils.camelize(fromName);
    fromName = utils.capitalizeFirstLetter(fromName);
    const fromtype = myTargetMetamodel.findObjectTypeByName(fromName);
    const toObj    = currentRel?.getToObject();
    let toName = toObj?.name;
    toName = utils.camelize(toName);
    toName = utils.capitalizeFirstLetter(toName);
    const totype   = myTargetMetamodel.findObjectTypeByName(toName);
    if (debug) console.log('341 fromObj, toObj: ', fromObj, toObj);
    if (debug) console.log('342 fromtype, totype, toname ', fromtype, totype, toName);
    let newName  = currentRel?.getName();
    let oldName = "";
    newName = utils.camelize(newName);
    if (newName !== constants.types.AKM_IS)
        newName = utils.uncapitalizeFirstLetter(newName);
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

// The following code fails due to that fromType and toType for some reason unknown are undefined   
            if (true) {
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
    if (debug) console.log('384 reltype: ', reltype);    
    if (debug) console.log('385 reltype, relname, fromtype, totype: ', reltype, relname, fromtype, totype);
    if (!reltype) {
        if (relname && fromtype && totype) // This is a new relationship type
        {
            if (debug) console.log('384 relname, fromtype, totype: ', relname, fromtype, totype);
            reltype = new akm.cxRelationshipType(utils.createGuid(), relname, fromtype, totype, currentRel.description);
            if (debug) console.log('386 reltype: ', reltype);
            { // Handle special attributes
                reltype.relshipkind = relship.relshipkind;
                reltype.cardinality = relship.cardinality;
            }
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
            myTargetMetamodel.addRelationshipType(reltype);
            myMetis.addRelationshipType(reltype);
            currentRel.generatedTypeId = reltype.id;
            if (debug) console.log('400 currentRel, reltype', currentRel, reltype);
        }
    }
    if (reltype) { // Create/Modify the relationship typeview
        reltypeview = reltype.typeview;
        if (!reltypeview) {
            const guid = utils.createGuid();
            reltypeview = new akm.cxRelationshipTypeView(guid, guid, reltype, "");
        }
        if (debug) console.log('419 relview, reltypeview', relview, reltypeview);
        reltypeview.applyRelationshipViewParameters(relview);
        reltypeview.setRelshipKind(reltype.relshipkind);
        reltype.typeview = reltypeview;
        if (debug) console.log('423 relview, reltypeview', relview, reltypeview);
        myTargetMetamodel.addRelationshipTypeView(reltypeview);
        myMetis.addRelationshipTypeView(reltypeview);
        if (debug) console.log('426 reltypeview', reltypeview);
        // const jsnRelshipType = new jsn.jsnRelationshipType(reltype, true);
        // if (debug) console.log('428 reltype, jsnRelshipType: ', reltype, jsnRelshipType);
        // modifiedTypeLinks.push(jsnRelshipType);
        // const jsnRelTypeview = new jsn.jsnRelshipTypeView(reltypeview);
        // if (debug) console.log('431 jsnRelTypeview: ', jsnRelTypeview);
        // modifiedTypeViews.push(jsnRelTypeview);
        // const jsnRelship = new jsn.jsnRelationship(currentRel);
        // modifiedRelships.push(jsnRelship);        
        // if (debug) console.log('435 currentRel, jsnRelship: ', currentRel, jsnRelship);
    }
    // Do the dispatches
    // modifiedTypeLinks?.map(mn => {
    //     let data = (mn) && mn;
    //     data = JSON.parse(JSON.stringify(data));
    //     myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
    // });
    // modifiedTypeViews?.map(mn => {
    //     let data = (mn) && mn;
    //     data = JSON.parse(JSON.stringify(data));
    //     myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
    // });
    // modifiedRelships?.map(mn => {
    //     let data = (mn) && mn 
    //     if (debug) console.log('464 data', data);
    //     data = JSON.parse(JSON.stringify(data));
    //     myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
    //     })
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
    const modifiedTypeLinks = new Array();

    const relname = object.name;
    const reltype = new akm.cxRelationshipType(utils.createGuid(), relname, fromType, toType, object.description);
    myTargetMetamodel.addRelationshipType(reltype);
    myMetis.addRelationshipType(reltype);

    { // Handle properties
        const proptypes = new Array();
        getAllPropertytypes(object, proptypes, myModel);
        if (debug) console.log('435 proptypes, myMetis', proptypes, myMetis);
        addProperties(reltype, proptypes, context);
        if (debug) console.log('437 reltype', reltype);
        const jsnRelshipType = new jsn.jsnRelationshipType(reltype, true);
        if (debug) console.log('439 Generate Relationship Type', reltype, jsnRelshipType);
        modifiedTypeLinks.push(jsnRelshipType);
   }

    modifiedTypeLinks?.map(mn => {
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
            myTargetMetamodel.addDatatype(dtype);
        } else {
            datatype = new akm.cxDatatype(utils.createGuid(), name, descr);
            myTargetMetamodel.addDatatype(datatype);
            myMetis.addDatatype(datatype);  
        }      
    }
    if (debug) console.log('475 datatype', datatype, myTargetMetamodel);
    if (datatype) {
        // Handle all aspects of the datatype
        const rels = object.findOutputRelships(myModel, constants.relkinds.REL);
        if (rels) {
            if (debug) console.log('480 rels', rels);
            let values  = new Array();
            // Check if it has a parent datatype
            for (let i=0; i < rels.length; i++) {
                    const rel = rels[i];
                    const parentObj = rel.toObject;
                    if (debug) console.log('485 parentObj', parentObj);
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
//     const rels = object.findOutputRelships(myModel, constants.relkinds.REL);
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
        const modifiedTypeNodes = new Array();
        modifiedTypeNodes.push(jsnMtdType);
        modifiedTypeNodes.map(mn => {
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
    let method   = myMetamodel?.findMethodByName(name);
    if (!method) {
        if (debug) console.log('695 method name:', name);
        method = myMetis.findMethodByName(name);
        if (!method) 
            method = new akm.cxMethod(utils.createGuid(), name, descr);
        myMetamodel.addMethod(method);
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
        if (mm.name === constants.admin.AKM_ADMIN_MM)
            continue;
        if (mm.id === myMetamodel.id)
            continue;
        mmlist.push(mm.nameId);
    }
      if (debug) console.log('724', mmlist, modalContext, context);
      myDiagram.handleOpenModal(mmlist, modalContext);
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
    const relships = obj.findOutputRelships(model, constants.relkinds.GEN);
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
        objectviews = currentNode.getGroupMembers2(context.myGoModel);
        relshipviews = currentNode.getGroupLinkMembers2(context.myGoModel);
    }
    if (debug) console.log('749 objviews, relviews', objectviews, relshipviews, context);
    generateMetamodel(objectviews, relshipviews, context);
    if (debug) console.log('785 myMetis', myMetis);

    // Check if there already exists models based on the generated metamodel
    // const models = myMetis.getModelsByMetamodel()
    return true;
}

export function generateMetamodel(objectviews: akm.cxObjectView[], relshipviews: akm.cxRelationshipView[], context: any): akm.cxMetaModel {
    if (debug) console.log('944 objectviews, relshipviews, context', objectviews, relshipviews, context);
    const myMetis     = context.myMetis as akm.cxMetis;
    const myMetamodel = context.myMetamodel as akm.cxMetaModel;
    const model       = context.myModel as akm.cxModel;
    const metamodel   = context.myTargetMetamodel as akm.cxMetaModel;
    const myDiagram   = context.myDiagram;
    const modifiedTypeNodes    = new Array();
    const modifiedMethods      = new Array();
    const modifiedObjTypeViews = new Array();
    const modifiedGeos         = new Array();
    const modifiedTypeLinks    = new Array();
    const modifiedRelTypeViews = new Array();
    const modifiedMetamodels   = new Array();

    if (!metamodel)
        return null;
      
    model.targetMetamodelRef = metamodel.id;
    metamodel.generatedFromModelRef = model.id;
    const mmname = metamodel.name;

    // Handle viewstyle
    const vsname = mmname + '_Viewstyle';
    let vstyle = metamodel.viewstyle;
    if (!vstyle) {
        vstyle = new akm.cxViewStyle(utils.createGuid(), vsname, "");
        metamodel.viewstyle = vstyle;
        metamodel.addViewStyle(vstyle);
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

    // Add existing method types to the new metamodel
    const mtdtypes = myMetamodel.methodtypes;
    if (mtdtypes) {
        metamodel.methodtypes = mtdtypes;
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
        if (dtype) metamodel.addDatatype(dtype);
    }

    // Add system types 
    // First object types
    // const systemtypes = ['Element', 'EntityType', 'RelshipType',  
    //                      'Generic', 'Container', 'Collection', 'Method'];
    // const systemtypes = ['Element', 'EntityType', 'Generic', 'Container'];
    let dsystemtypes = ['Datatype', 'Value', 'FieldType', 'InputPattern', 'ViewFormat'];
    let objtypes;
    if (model.includeSystemtypes) {
        objtypes = myMetamodel.objecttypes;
        metamodel.includeInheritedReltypes = true;
    } else {
        objtypes = [];
        const otypes = myMetamodel.objecttypes;
        for (let i=0; i<otypes.length; i++) {
            let otype = otypes[i];
            otype = myMetis.findObjectType(otype.id);
            const typename = otype.name;
            // Filter types not to be generated
            if (utils.nameExistsInNames(dsystemtypes, typename))
                continue;
            if (otype.isOfType('Property'))
                continue;
            if (otype.isOfType('Method'))
                continue;
            if (otype.isOfType('MethodType'))
                continue;
            if (otype.isOfType('RelshipType'))
                continue;
            // End filtering
            const type = myMetamodel.findObjectTypeByName(typename);
            objtypes.push(type);
        }
    }
    // Add system object types
    if (debug) console.log('1082 objecttypes', objtypes);
    for (let i=0; i<objtypes.length; i++) {
        // if (!objtypes[i]) continue; 
        const typename = objtypes[i]?.name;
        const objtype = myMetamodel.findObjectTypeByName(typename);
        if (debug) console.log('1076 typename, objtype', typename, objtype);
        if (objtype) {
            metamodel.addObjectTypeByName(objtype);
            metamodel.addObjectTypeView(objtype.typeview as akm.cxObjectTypeView);
            let geo = new akm.cxObjtypeGeo(utils.createGuid(), metamodel, objtype, "", "");
            metamodel.addObjtypeGeo(geo);
            const jsnObjTypegeo = new jsn.jsnObjectTypegeo(geo);
            if (debug) console.log('1083 Generate Object Type', jsnObjTypegeo, myMetis);
            modifiedGeos.push(jsnObjTypegeo);
        }
    }
    if (debug) console.log('1098 objtypes, metamodel', objtypes, metamodel);
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
            const typename = rtype.name;
            // Filter types not to be generated
            const objtypes = metamodel.objecttypes;
            const fromtype = rtype.fromObjtype;
            const totype = rtype.toObjtype;
            if (utils.getIntersection(objtypes, [fromtype, totype]).length === 0)
                continue;
            const type = myMetamodel.findRelationshipTypeByName1(typename, fromtype, totype);
            reltypes.push(type);
            if (debug) console.log('1121 type, typename, fromtype, totype', type, type.name, fromtype.name, totype.name);
        }
        if (debug) console.log('1123 reltypes', reltypes);
    }
    for (let i=0; i<reltypes.length;i++) {
        const reltype = reltypes[i];
        if (reltype) {
            metamodel.addRelationshipType(reltype);
            metamodel.addRelationshipTypeView(reltype.typeview as akm.cxRelationshipTypeView);
            if (debug) console.log('1130 metamodel, reltype', metamodel, reltype);
        }
    }
    if (debug) console.log('1133 metamodel', metamodel);
    if (debug) console.log('1134 system relship types completed', myMetis);
    // ---
    // Adding system types completed
    // ---
    let metaObject;
    { // Add or generate objecttypes
        const metaObjects = ['EntityType'];
        for (let i=0; i<metaObjects.length; i++) {
            const mObject = metaObjects[i];
            const mType = myMetamodel.findObjectTypeByName(mObject);
            if (mType) {
                metaObject = mObject;
                break;
            }
        }
        if (debug) console.log('1092 objectviews', objectviews);
        if (objectviews) {
            if (debug) console.log('1094 objectviews', objectviews);
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
                for (let i=0; i<typenames.length; i++) {
                    if (debug) console.log('945 i, obj, type', i, obj, typenames[i]);
                    const type = myMetamodel.findObjectTypeByName(typenames[i]);
                    if (debug) console.log('947 type, obj', type, obj);
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
                            if (debug) console.log('953 obj', obj.name, obj);
                            if (debug) console.log('956 obj, objview', obj, objview);                               
                            objtype = generateObjectType(obj, objview, context);
                            if (debug) console.log('958 objtype', objtype);   
                            if (objtype) metamodel.addObjectType(objtype);
                            if (objtype) metamodel.addObjectType0(objtype);
                            const typeview = objtype?.typeview;
                            if (typeview) {
                                metamodel.addObjectTypeView(typeview); 
                                vstyle.addObjectTypeView(typeview);
                                metamodel.addViewStyle(vstyle); 
                            }
                            if (debug) console.log('966 metamodel ', metamodel);                            
                        }
                    }
                }
            }
        }
        if (debug) console.log('1170 metamodel ', metamodel);
    }
    // Add or generate relationship types
    { // First handle relationships of type "relationshipType"
        if (relshipviews) {
            if (debug) console.log('1205 relshipviews', relshipviews);
            for (let i=0; i<relshipviews.length; i++) {
                const relview = relshipviews[i];
                if (debug) console.log('1208 relview', relview);
                if (!relview) continue;
                const rel = relview.relship;
                if (rel.isSystemRel()) {
                    if (debug) console.log('1184 rel', rel);
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
                if (debug) console.log('1247 relview', relview);
                if (fromObj?.isOfSystemType(metaObject) && 
                    toObj?.isOfSystemType(metaObject)) {
                    if (debug) console.log('1250 rel.name, relview', rel.name, relview);
                    const reltype = generateRelshipType(rel, relview, context);
                    if (debug) console.log('1252 rel, reltype', rel, reltype);                    
                    // Prepare dispatches
                    if (reltype) {
                        metamodel.addRelationshipType(reltype);
                        metamodel.addRelationshipType0(reltype);
                        const jsnRelshipType = new jsn.jsnRelationshipType(reltype, true);
                        if (debug) console.log('1257 Generate Relationship Type', reltype, jsnRelshipType);
                        const modifiedTypeLinks = new Array();
                        modifiedTypeLinks.push(jsnRelshipType);
                        const relTypeview = reltype.typeview;
                        if (relTypeview) {
                            metamodel.addRelationshipTypeView(relTypeview); 
                            myMetis.addRelationshipTypeView(relTypeview); 
                            const jsnRelTypeview = new jsn.jsnRelshipTypeView(relTypeview);
                            if (debug) console.log('1265 Generate Reltypeview', jsnRelTypeview);
                            modifiedRelTypeViews.push(jsnRelTypeview);
                        }
                    }
                }
            }
        }
    }
    if (debug) console.log('1216 metamodel ', metamodel);
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
            const rels = obj.findOutputRelships(model, constants.relkinds.REL);
            let fromObj, toObj, fromObjType, toObjType;
            for (let i=0; i<rels.length; i++) {
                const rel = rels[i];
                if (rel.type.name === 'from') {
                    fromObj = rel.toObject;
                    const typename = fromObj?.name;
                    fromObjType = metamodel.findObjectTypeByName(typename);
                } else if (rel.type.name === 'to') {
                    toObj = rel.toObject;
                    const typename = toObj?.name;
                    toObjType = metamodel.findObjectTypeByName(typename);
                }
            }
            if (debug) console.log('1284 rtypename, fromObjType, toObjType', rtypename, fromObjType, toObjType);
            // Check if relationship type already exists
            let reltype = myMetis.findRelationshipTypeByName1(rtypename, fromObjType, toObjType);
            if (!reltype) {
                // This is a new relationship type
                reltype = generateRelshipType2(obj, fromObjType, toObjType, context);
                if (debug) console.log('1290 reltype', reltype);
                if (reltype) {
                    metamodel.addRelationshipType(reltype);
                    const jsnRelshipType = new jsn.jsnRelationshipType(reltype, true);
                    if (debug) console.log('1229 Generate Relationship Type', reltype, jsnRelshipType);
                    const modifiedTypeLinks = new Array();
                    modifiedTypeLinks.push(jsnRelshipType);
                    const relTypeview = reltype.typeview as akm.cxRelationshipTypeView;
                    if (relTypeview) {
                        metamodel.addRelationshipTypeView(relTypeview); 
                        const jsnRelTypeview = new jsn.jsnRelshipTypeView(relTypeview);
                        if (debug) console.log('1301 Generate Reltypeview', jsnRelTypeview);
                        modifiedRelTypeViews.push(jsnRelTypeview);
                    }
                }
            }  
            { // Handle properties
                const proptypes = new Array();
                getPropertyTypes(obj, proptypes, context);
                getAllPropertytypes(obj, proptypes, model);
                if (debug) console.log('1309 proptypes, myMetis', proptypes, myMetis);
                addProperties(reltype, proptypes, context);
                if (debug) console.log('1311 reltype', reltype);
                const jsnRelshipType = new jsn.jsnRelationshipType(reltype, true);
                if (debug) console.log('1313 Generate Relationship Type', reltype, jsnRelshipType);
                modifiedTypeLinks.push(jsnRelshipType);
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
        const rels = model?.getRelationshipsByTypeName('Is', constants.relkinds.GEN);
        if (debug) console.log('1346 model, rels', model, rels);
        if (rels) {
            for (let i=0; i<rels.length; i++) {
                const rel = rels[i];
                const fromObj = rel.fromObject;
                const toObj = rel.toObject;
                if (fromObj && toObj) {
                    const fromType = metamodel.findObjectTypeByName(fromObj.name);
                    const toType = metamodel.findObjectTypeByName(toObj.name);
                    if (fromType && toType) {
                        // We want to add an Is relationship between fromType and toType
                        // First check if this relationship type already exists
                        let found = false;
                        const reltypes = metamodel.findRelationshipTypesBetweenTypes(fromType, toType, false);
                        if (debug) console.log('1360 metamodel, reltypes', metamodel, reltypes);
                        if (reltypes) {
                            for (let i=0; i<reltypes.length; i++) {
                                const reltype = reltypes[i];
                                if (reltype.name === 'Is') {
                                    found = true;
                                    break;
                                }
                            }
                        }
                        if (!found) {
                            const reltype = new akm.cxRelationshipType(utils.createGuid(), 'Is', fromType, toType, "");
                            reltype.relshipkind = constants.relkinds.GEN;
                            fromType.addOutputreltype(reltype);
                            if (debug) console.log('1374 fromType, toType, reltype', fromType, toType, reltype);
                            metamodel.addRelationshipType(reltype);
                            myMetis.addRelationshipType(reltype);
                       }
                    }
                }
            }
        }            
    }
    metamodel.includeInheritedReltypes = model.includeSystemtypes;
    myMetis.currentTargetMetamodel = metamodel;
    myMetis.currentTargetModel = model;
    { // Dispatch metis
        const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
        if (debug) console.log('1402 jsnMetis: ', jsnMetis);
        let data = {metis: jsnMetis}
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
    }
    { // Remove duplicate relationship types
        const rels = metamodel.relshiptypes;
        for (let j=0; j<rels?.length; j++) {
            const rel = rels[j];
            for (let k=j+1; k<rels?.length; k++) {
                const rel2 = rels[k];
                if (rel.fromObjtype?.id === rel2.fromObjtype?.id 
                    && rel.toObjtype?.id === rel2.toObjtype?.id
                    && rel.name === rel2.name) {
                    if (debug) console.log('Removing duplicate relship type', rel, rel2);
                    rels.splice(k, 1);
                    k--;
                }
            }
        }
        if (debug) console.log('1399 metamodel', metamodel);
        // Dispatch metis
        const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
        if (debug) console.log('1402 jsnMetis: ', jsnMetis);
        let data = {metis: jsnMetis}
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
    }
    alert("Target metamodel has been successfully generated!");
    return metamodel;
}

function getAllPropertytypes(obj: akm.cxObject, proptypes: any, myModel: akm.cxModel) {
    // Check if obj inherits another obj
    const genrels = obj?.findOutputRelships(myModel, constants.relkinds.GEN);
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

function getPropertyTypes(obj: akm.cxObject, proptypes: any, myModel: akm.cxModel) {
    const rels = obj?.findOutputRelships(myModel, constants.relkinds.REL);
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
}

function getInheritedProperties(obj: akm.cxObject, properties: any, myModel: akm.cxModel) {
    // Check if obj inherits another obj
    const genrels = obj?.findOutputRelships(myModel, constants.relkinds.GEN);
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
}

function getPropertiesInGroup(groupId: string, proptypes: any, myModel: akm.cxModel) {
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
}

function addProperties(type: akm.cxType | akm.cxMethodType, proptypes: any, context: any) {
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
            let rels = proptype.findOutputRelships(myModel, constants.relkinds.REL);
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
            rels = proptype.findOutputRelships(myModel, constants.relkinds.REL);
            if (debug) console.log('1264 rels', rels);
            if (prop && rels) {
                for (let i=0; i < rels.length; i++) {
                    let rel = rels[i];
                    if (!rel.markedAsDeleted) {
                        if (rel.name === constants.types.AKM_HAS_METHOD) {
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