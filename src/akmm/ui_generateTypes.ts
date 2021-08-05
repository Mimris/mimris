// @ts- nocheck
const debug = false;

import * as utils from './utilities';
import * as akm from './metamodeller';
import * as gjs from './ui_gojs';
import * as gql from './ui_graphql';
import { setMyGoModel } from '../actions/actions';
import { FaObjectUngroup } from 'react-icons/fa';
const constants = require('./constants');

export function askForMetamodel(context: any, create: boolean, hideEKA: boolean) {
    const myMetis = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const metamodels = myMetis.metamodels;
    if (debug) console.log('16 ui_gererateTypes', context);
    
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
        if (debug) console.log('44 askForMetamodel', myMetis);
        if (!metamodel) {
            if (confirm("Create new metamodel '" + mmname + "' ?")) {
                metamodel = new akm.cxMetaModel(utils.createGuid(), mmname, "");
                myMetis.addMetamodel(metamodel);
            } else {
                alert("Operation was cancelled!");
                return;
            }
        }
        if (debug) console.log('54 myMetis', myMetis);
        return metamodel;
    }
} 

export function generateObjectType(object: akm.cxObject, objview: akm.cxObjectView, context: any) {
    const myDiagram   = context.myDiagram;
    const myMetis     = context.myMetis;
    const myMetamodel = myMetis.currentMetamodel;
    const myModel     = context.myModel;
    const myTargetMetamodel = context.myTargetMetamodel;
    const modifiedObjects = new Array();
    const modifiedTypeViews = new Array();
    let parentRelType: akm.cxRelationshipType | null = null;
    if (debug) console.log('68 object, objview', object, objview);
    if (!object) {
        return;
    }
    if (debug) console.log('72 context', context);
    const typid = object.generatedTypeId;
    if (debug) console.log('74 typid', typid, typid.length);
    const obj = myMetis.findObject(object.id);
    let newName  = object?.name;
    let oldName = "";
    newName = utils.camelize(newName);
    newName = utils.capitalizeFirstLetter(newName);
    let objname = newName;
    if (debug) console.log('81 newName', newName);
    let objtype: akm.cxObjectType;
    if (typid) { // The object type exists - has been generated before
        objtype = myMetis.findObjectType(typid);
        oldName = objtype?.getName();
        objtype?.setName(newName);
    } else {
        // Check if the types has not been generated, but exists anyway
        objtype = myTargetMetamodel?.findObjectTypeByName(obj.name);
        if (debug) console.log('90 obj, objtype', obj, objtype);
    }
    if (debug) console.log('92 newName', newName);
    if (!objtype) { // This is a new object type
        let metaObject;
        const metaObjects = ['Entity'];
        for (let i=0; i<metaObjects.length; i++) {
            const mObject = metaObjects[i];
            const mType = myMetamodel.findObjectTypeByName(mObject);
            if (mType) {
                metaObject = mObject;
                break;
            }
        }
        if (debug) console.log('103 metaObject', metaObject);
        if (obj.type.name === metaObject) {
            if (!objtype) {     // New object type - Create it                
                let name = objname;
                objtype = new akm.cxObjectType(utils.createGuid(), name, obj.description);
                // Handle special attributes
                objtype.viewkind = obj.viewkind;
                // Handle the properties
                const properties = obj.type?.getProperties(true);
                if (properties !== undefined && properties !== null && properties.length > 0)
                    objtype.properties = properties;
                else
                    objtype.properties = new Array();
                myTargetMetamodel?.addObjectType(objtype);
                myMetis.addObjectType(objtype);
                object.generatedTypeId = objtype.getId();
                const gqlObject = new gql.gqlObject(object);
                modifiedObjects.push(gqlObject);        
                if (debug) console.log('159 object, gqlObject: ', object, gqlObject);
                if (debug) console.log('160 objtype', objtype);
                // Create objecttypeview
                const id = utils.createGuid();
                const objtypeview = new akm.cxObjectTypeView(id, id, objtype, obj.description);
                objtypeview.applyObjectViewParameters(objview);
                if (debug) console.log('165 objtype, objtypeview', objtype, objtypeview);
                objtype.typeview = objtypeview;
                objtype.setModified();
                myMetis.addObjectTypeView(objtypeview);
                if (myTargetMetamodel) { // Handle geos
                    if (!myTargetMetamodel.objtypegeos) 
                        myTargetMetamodel.objtypegeos = new Array();
                    const objtypegeo = new akm.cxObjtypeGeo(utils.createGuid(), myTargetMetamodel, objtype, "0 0", "100 50");
                    myMetis.addObjtypeGeo(objtypegeo);
                    myTargetMetamodel.addObjtypeGeo(objtypegeo);
                    if (debug) console.log('176 myTargetMetamodel', myTargetMetamodel);
                } 
                if (debug) console.log('178 myMetis', myMetis);
            } else {
                // To ensure that objtype is a class instance
                objtype = myMetis.findObjectType(objtype.id);
                const typeview = objtype.typeview as akm.cxObjectTypeView;
                if (debug) console.log('183 objview, typeview', objview, typeview);
                typeview?.applyObjectViewParameters(objview);
                if (debug) console.log('185 typeview', typeview);
            }
            if (debug) console.log('187 objtype, myMetis', objtype, myMetis);
            let parentType: akm.cxObjectType | null = null;
            if (objtype) {
                objtype.setModified();
                if (!parentType)
                    parentType = obj.type;
                // Connect objtype to parentType
                // First check if it already exists
                parentRelType = myMetis.findRelationshipTypeByName2('Is', objtype, parentType);
                if (!parentRelType) {
                    parentRelType  = new akm.cxRelationshipType(utils.createGuid(), 'Is', objtype, parentType, "");
                    parentRelType.setModified();
                    parentRelType.setRelshipKind('Generalization');
                    myMetamodel.addRelationshipType(parentRelType);
                    myTargetMetamodel.addRelationshipType(parentRelType);
                    myMetis.addRelationshipType(parentRelType);
                }
                if (debug) console.log('211 objtype, parentType, parentRelType', objtype, parentType, parentRelType);
                if (debug) console.log('212 generateObjectType', myMetis);
            }  
        }
    } else {
        const typeview = objtype.typeview as akm.cxObjectTypeView;
        if (debug) console.log('172 objview, typeview', objview, typeview);
        typeview?.applyObjectViewParameters(objview);
        if (debug) console.log('174 typeview', typeview);
    }
    if (!objtype)
        return null;
    if (debug) console.log('178 objtype, myMetis', objtype, myMetis);
    // Handle properties
    const proptypes = new Array();
    getAllPropertytypes(object, proptypes, myModel);
    if (debug) console.log('182 proptypes, myMetis', proptypes, myMetis);
    for (let i=0; i < proptypes.length; i++) {
        // Check if property already exists
        let proptype = proptypes[i];
        let prop = objtype.findPropertyByName(proptype.name);
        if (debug) console.log('187 proptype, prop', proptype, prop);
        // if (!prop) {
        //     prop = myTargetMetamodel.findPropertyByName(proptype.name);
        //     if (debug) console.log('190 prop', prop);
            if (!prop) {
                // New property - create it
                prop = new akm.cxProperty(utils.createGuid(), proptype.name, proptype.description);
                let datatype = myMetis.findDatatypeByName("string");
                prop.setDatatype(datatype);
                objtype.addProperty(prop);
                myTargetMetamodel.addProperty(prop);
                myMetis.addProperty(prop);
                if (debug) console.log('199 prop', prop);
            } else {
                objtype.addProperty(prop);
            }
        // }
        if (debug) console.log('204 objtype, prop, targetMetamodel', objtype, prop, myTargetMetamodel);
        if (prop) {
            const p = myMetis.findProperty(prop.id);
            prop = p ? p : prop;
            // Find datatype connected to current property
            let rels = proptype.findOutputRelships(myModel, constants.relkinds.REL);
            if (debug) console.log('210 rels', rels);
            if (prop && rels) {
                for (let i=0; i < rels.length; i++) {
                    let rel = rels[i];
                    if (!rel.markedAsDeleted) {
                        if (rel.name === constants.types.AKM_IS_OF_DATATYPE) {
                            let dtype = rel.toObject;
                            if (dtype) {
                                const datatype = myMetis.findDatatypeByName(dtype.name);
                                if (debug) console.log('219 datatype', datatype);
                                if (datatype) prop.setDatatype(datatype);
                            }
                        }
                        // if (rel.name === constants.types.AKM_HAS_UNIT) {
                        //     let u = rel.toObject;
                        //     if (u) {
                        //         const unit = myMetis.findUnitByName(u.name);
                        //         if (unit) prop.setUnit(unit);
                        //     }
                        // }
                    }
                    if (debug) console.log('231 property', prop);
                    objtype.addProperty(prop);
                    myTargetMetamodel?.addProperty(prop);
                    myMetis.addProperty(prop); 
                }                           
            }
            // Find method connected to current property
            rels = proptype.findOutputRelships(myModel, constants.relkinds.REL);
            if (debug) console.log('239 rels', rels);
            if (prop && rels) {
                for (let i=0; i < rels.length; i++) {
                    let rel = rels[i];
                    if (!rel.markedAsDeleted) {
                        if (rel.name === constants.types.AKM_HAS_METHOD) {
                            let mtype = rel.toObject;
                            if (mtype) {
                                const method = myMetis.findMethodByName(mtype.name);
                                if (debug) console.log('248 method', method);
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
    if (debug) console.log('259 objtype', objtype);
    // Do the dispatches
    const props = objtype?.properties;
    const modifiedProps = new Array();
    for (let i=0; i<props?.length; i++) {
        const gqlProperty = new gql.gqlProperty(props[i]);
        if (debug) console.log('265 prop, gqlProperty', props[i], gqlProperty);
        modifiedProps.push(gqlProperty);
    }
    if (modifiedProps?.length > 0) {
        modifiedProps.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_PROPERTY_PROPERTIES', data })
        });
        if (debug) console.log('274 modifiedProps', modifiedProps);
    }
    if (debug) console.log('276 objtype', objtype);
    const gqlObjectType = new gql.gqlObjectType(objtype, true);
    if (debug) console.log('278 gqlObjectType', gqlObjectType);
    const modifiedTypeNodes = new Array();
    modifiedTypeNodes.push(gqlObjectType);
    modifiedTypeNodes.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPE_PROPERTIES', data })
    });
    if (debug) console.log('286 modifiedTypeNodes', modifiedTypeNodes, myMetis);
    const typeview = objtype.typeview as akm.cxObjectTypeView;
    if (objtype.typeview) {
        const gqlObjTypeview = new gql.gqlObjectTypeView(typeview);
        if (debug) console.log('290 gqlObjTypeview', gqlObjTypeview);
        modifiedTypeViews.push(gqlObjTypeview);
        modifiedTypeViews?.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES', data })
        });
        if (debug) console.log('297 modifiedTypeViews', modifiedTypeViews);
    }

    const geo = myTargetMetamodel.findObjtypeGeoByType(objtype);
    if (geo) {
        const gqlObjTypegeo = new gql.gqlObjectTypegeo(geo);
        if (debug) console.log('303 Generate Object Type', gqlObjTypegeo, myMetis);
        const modifiedGeos = new Array();
        modifiedGeos.push(gqlObjTypegeo);
        modifiedGeos?.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES', data })
        })
        if (debug) console.log('311 myMetis', modifiedGeos, myMetis);
    }
    if (parentRelType) {
        const modifiedTypeLinks = new Array();
        const gqlRelshipType = new gql.gqlRelationshipType(parentRelType, true);
        if (debug) console.log('336 Generate Relationship Type', parentRelType, gqlRelshipType);
        modifiedTypeLinks.push(gqlRelshipType);
        modifiedTypeLinks.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
        });
        if (debug) console.log('343 myMetis', modifiedTypeLinks, myMetis);                                    // Then handle the object type
    }

    modifiedObjects?.map(mn => {
        let data = (mn) && mn 
        if (debug) console.log('328 data', data);
        myDiagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
        })
    if (debug) console.log('331 objtype', objtype);
    return objtype;
}

export function generateRelshipType(relship: akm.cxRelationship, relview: akm.cxRelationshipView, context: any) {
    if (debug) console.log('356 relship, relview: ', relship, relview);
    const myDiagram   = context.myDiagram;
    const myMetis     = context.myMetis;
    const myTargetMetamodel = context.myTargetMetamodel;
    if (!relship) {
        return;
    }
    let typid = relship.generatedTypeId;
    if (debug) console.log('364 typid', typid, typid.length);
    if (debug) console.log('365 myTargetMetamodel', myTargetMetamodel);
    const modifiedRelships = new Array();
    // relship is the relationship defining the relationship type to be generated
    const currentRel  = myMetis.findRelationship(relship.id);
    if (debug) console.log('369 currentRel: ', currentRel);
    const fromObj  = currentRel.getFromObject();
    let fromName = fromObj.name;
    fromName = utils.camelize(fromName);
    fromName = utils.capitalizeFirstLetter(fromName);
    const fromtype = myTargetMetamodel.findObjectTypeByName(fromName);
    const toObj    = currentRel.getToObject();
    let toName = toObj.name;
    toName = utils.camelize(toName);
    toName = utils.capitalizeFirstLetter(toName);
    const totype   = myTargetMetamodel.findObjectTypeByName(toName);
    if (debug) console.log('380 fromObj, toObj: ', fromObj, toObj);
    if (debug) console.log('381 fromtype, totype: ', fromtype, totype);
    let newName  = currentRel?.getName();
    let oldName = "";
    newName = utils.camelize(newName);
    if (newName !== 'Is')
        newName = utils.uncapitalizeFirstLetter(newName);
    let relname = newName;
    let reltype;
    if (typid?.length > 0) {
        reltype = myMetis.findRelationshipType(typid);
        if (reltype) {
            let fromType = reltype.fromObjtype;
            fromType = myMetis.findObjectType(fromType?.id);
            if (fromType) {
                let toType = reltype.toObjtype;
                toType = myMetis.findObjectType(toType?.id);
                if (!toType)
                    reltype = null;
            } else
                reltype = null;
        }
        oldName = reltype?.getName();
        reltype?.setName(newName);
    }
    if (debug) console.log('404 reltype: ', reltype);
    if (!reltype) {
        // Check if reltype exists between fromtype and to type with name === newName
        if (debug) console.log('490 relname, fromtype, totype:', relname, fromtype, totype);
        reltype = myTargetMetamodel.findRelationshipTypeByName2(relname, fromtype, totype);
        if (debug) console.log('492 reltype: ', reltype);
        if (reltype) {
            reltype.relshipkind = relship.relshipkind;
            reltype.cardinality = relship.cardinality;
            const reltypeview = reltype.typeview;
            if (reltypeview) {
                reltypeview.setRelshipKind(reltype.relshipkind);
                if (debug) console.log('498 reltypeview', reltypeview);
                const gqlRelTypeview = new gql.gqlRelshipTypeView(reltypeview);
                if (debug) console.log('500 Generate Relationship Type', gqlRelTypeview);
                const modifiedTypeViews = new Array();
                modifiedTypeViews.push(gqlRelTypeview);
                modifiedTypeViews?.map(mn => {
                    let data = (mn) && mn;
                    data = JSON.parse(JSON.stringify(data));
                    myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES', data })
                });
            }
        }
    }
    if (!reltype) {
        // This is a new relationship type - Create it
        if (debug) console.log('429 new relship type: ', newName);
        const reltype = new akm.cxRelationshipType(utils.createGuid(), relname, fromtype, totype, currentRel.description);
        reltype.relshipkind = relship.relshipkind;
        reltype.cardinality = relship.cardinality;
        myTargetMetamodel.addRelationshipType(reltype);
        myMetis.addRelationshipType(reltype);
        currentRel.generatedTypeId = reltype.getId();
        if (debug) console.log('436 currentRel, reltype', currentRel, reltype);
        const gqlRelship = new gql.gqlRelationship(relship);
        modifiedRelships.push(gqlRelship);        
        if (debug) console.log('439 currentRel, gqlRelship: ', currentRel, gqlRelship);
        // Create relationship typeview
        const guid = utils.createGuid();
        let reltypeview = new akm.cxRelationshipTypeView(guid, guid, reltype, "");
        reltypeview.applyRelationshipViewParameters(relview);
        reltypeview.setRelshipKind(reltype.relshipkind);
        reltype.typeview = reltypeview;
        myTargetMetamodel.addRelationshipTypeView(reltypeview);
        myMetis.addRelationshipTypeView(reltypeview);
        if (debug) console.log('448 reltypeview', reltypeview);
        const gqlRelshipType = new gql.gqlRelationshipType(reltype, true);
        if (debug) console.log('450 Generate Relationship Type', reltype, gqlRelshipType);
        const modifiedTypeLinks = new Array();
        modifiedTypeLinks.push(gqlRelshipType);
        modifiedTypeLinks.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
        });
        const gqlRelTypeview = new gql.gqlRelshipTypeView(reltypeview);
        if (debug) console.log('459 Generate Relationship Type', gqlRelTypeview);
        const modifiedTypeViews = new Array();
        modifiedTypeViews.push(gqlRelTypeview);
        modifiedTypeViews?.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES', data })
        });
        currentRel.generatedTypeId = reltype.id;
    } else {
        // This is a RENAME of a reltype
        if (debug) console.log('470 rename relship type to: ', newName);
        const reltype = myMetis.findRelationshipType(relship.generatedTypeId);
        if (!reltype) 
            return;     // An error - do nothing
        // Rename the type
        reltype.name = newName;
        // const gqlRelshipType = new gql.gqlRelationshipType(reltype);
        // if (debug) console.log('502 Generate Relationship Type', reltype, gqlRelshipType);
        // const modifiedTypeLinks = new Array();
        // modifiedTypeLinks.push(gqlRelshipType);
        // modifiedTypeLinks.map(mn => {
        //     let data = (mn) && mn;
        //     data = JSON.parse(JSON.stringify(data));
        //     myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
        // });
        
        // Find rels of this type 
    }
    modifiedRelships?.map(mn => {
        let data = (mn) && mn 
        if (debug) console.log('573 data', data);
        myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
        })
    if (debug) console.log('493 reltype', reltype);
    return reltype;
}

export function generateDatatype(obj: akm.cxObject, context: any) {
    const myMetis  = context.myMetis;
    const myModel  = context.myModel;
    const myDiagram = context.myDiagram;
    const object   = myMetis.findObject(obj.id);
    const name     = object.name;
    const descr    = object.description;
    const myMetamodel = context.myMetamodel;
    const myTargetMetamodel = context.myTargetMetamodel;
    if (!myTargetMetamodel)
        return null;
    let datatype   = myTargetMetamodel?.findDatatypeByName(name);
    if (!datatype) {
        if (debug) console.log('510 datatype name:', name);
        const dtype = myMetis.findDatatypeByName(name);
        if (debug) console.log('512 dtype:', dtype);
        if (dtype) {
            myTargetMetamodel.addDatatype(dtype);
        } else {
            datatype = new akm.cxDatatype(utils.createGuid(), name, descr);
            myTargetMetamodel.addDatatype(datatype);
            myMetis.addDatatype(datatype);  
        }      
    }
    if (debug) console.log('521 datatype', datatype, myTargetMetamodel);
    if (datatype) {
        // Check if it has a parent datatype
        const rels = object.findOutputRelships(myModel, constants.relkinds.REL);
        if (rels) {
            if (debug) console.log('526 rels', rels);
            let values  = new Array();
            for (let i=0; i < rels.length; i++) {
                const rel = rels[i];
                const parentObj = rel.toObject;
                if (debug) console.log('531 parentObj', parentObj);
                const parentType = parentObj.type;
                if (debug) console.log('533 parentType', parentType);
                if (parentType.name === constants.types.AKM_DATATYPE) {
                    if (debug) console.log('535 rel', rel);
                    let parentDtype = myMetis.findDatatypeByName(parentObj.name);
                    if (debug) console.log('537 dtype', parentDtype);
                    datatype.setIsOfDatatype(parentDtype);
                    // Copy default values from parentDtype
                    datatype.setInputPattern(parentDtype?.inputPattern);
                    datatype.setViewFormat(parentDtype?.viewFormat);
                    datatype.setFieldType(parentDtype?.fieldType);
                }
            }  
            // Find allowed values if any
            if (!debug) console.log('546 rels', rels);
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
                    if (debug) console.log('638 rels', rels);
                }
                else if (rel.getName() === constants.types.AKM_IS_DEFAULTVALUE) {
                    let valueObj = rel.toObject;
                    datatype.setDefaultValue(valueObj.name);
                    if (debug) console.log('643 defaultValue', valueObj.name);
                }
                for (let i=0; i< values.length; i++) {
                    datatype.addAllowedValue(values[i]);
                    if (debug) console.log('647 allowedValue', values[i]);
                }
            }

            for (let i=0; i < rels.length; i++) {
                let rel = rels[i];
                if (rel.getName() === constants.types.AKM_HAS_INPUTPATTERN) {
                    const toObj = rel.getToObject();
                    if (toObj.type.name === constants.types.AKM_INPUTPATTERN) {
                        let valueObj = toObj;
                        datatype.setInputPattern(valueObj.inputPattern);
                    }
                }
                if (rel.getName() === constants.types.AKM_HAS_VIEWFORMAT) {
                    const toObj = rel.getToObject();
                    if (toObj.type.name === constants.types.AKM_VIEWFORMAT) {
                        let valueObj = toObj;
                        datatype.setViewFormat(valueObj.viewFormat);
                    }
                }
                if (rel.getName() === constants.types.AKM_HAS_FIELDTYPE) {
                    const toObj = rel.getToObject();
                    if (toObj.type.name === constants.types.AKM_FIELDTYPE) {
                        let valueObj = toObj;
                        datatype.setFieldType(valueObj.fieldType);
                    }
                }
            }
            if (debug) console.log('594 datatype', datatype);
            myTargetMetamodel.addDatatype(datatype);
            // Update phData
            const gqlDatatype = new gql.gqlDatatype(datatype);
            const modifiedDatatypes = new Array();
            modifiedDatatypes.push(gqlDatatype);
            if (debug) console.log('600 ui_generateTypes', gqlDatatype, modifiedDatatypes);
            modifiedDatatypes.map(mn => {
                let data = (mn) && mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_DATATYPE_PROPERTIES', data })
            });

            if (debug) console.log('607 generateDatatype', datatype, myMetis);
            return datatype;
        }
    }
}

export function generateMethod(obj: akm.cxObject, context: any) {
    const myMetis  = context.myMetis;
    const myModel  = context.myModel;
    const myDiagram = context.myDiagram;
    const object   = myMetis.findObject(obj.id);
    const name     = object.name;
    const descr    = object.description;
    const myMetamodel = context.myMetamodel;
    const myTargetMetamodel = context.myTargetMetamodel;
    if (!myTargetMetamodel)
        return null;
    let method   = myTargetMetamodel?.findMethodByName(name);
    if (!method) {
        if (debug) console.log('647 method name:', name);
        method = myMetis.findMethodByName(name);
        if (!method) 
            method = new akm.cxMethod(utils.createGuid(), name, descr);
        if (debug) console.log('649 method:', method);
    }
    if (method) {
        method.methodType = obj["methodType"];
        method.expression = obj["expression"];
        method.script = obj["script"];
        myTargetMetamodel.addMethod(method);
        myMetis.addMethod(method);  
    }      
    
    if (debug) console.log('658 method', method, myTargetMetamodel);
    // Update phData
    const gqlMethod = new gql.gqlMethod(method);
    const modifiedMethods = new Array();
    modifiedMethods.push(gqlMethod);
    if (debug) console.log('663 ui_generateTypes', gqlMethod, modifiedMethods);
    modifiedMethods.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_METHOD_PROPERTIES', data })
    });

    if (debug) console.log('670 generateMethod', method, myMetis);
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

    if (confirm('Do you want to include system types?')) {
        myMetis.currentModel.includeSystemtypes = true;
    } else {
        myMetis.currentModel.includeSystemtypes = false;
    }

    const args = {
        "metamodel":    myMetis.currentTargetMetamodel, 
        "modelview":    myMetis.currentModelview, 
    }
    const context = {
        "myMetis":            myMetis,
        "myMetamodel":        myMetis.currentMetamodel,
        "myModel":            myMetis.currentModel,
        "myCurrentModelview": myMetis.currentModelview,
        "myDiagram":          myDiagram,
        "case":               "Generate Target Metamodel",
        "title":              "Select Target Metamodel",
        "dispatch":           myDiagram.dispatch,
        "postOperation":      generateTargetMetamodel2,
        "args":               args
    }
    askForTargetMetamodel(context);
}

export function askForTargetMetamodel(context: any) {
    const myMetis = context.myMetis;
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
      const mmNameIds = myMetis.metamodels.map(mm => mm && mm.nameId);
      if (debug) console.log('667', mmNameIds, modalContext, context);
      myDiagram.handleOpenModal(mmNameIds, modalContext);
}

export function generateTargetMetamodel2(context: any) {
    const args = context.args;
    const targetmetamodel = context.myTargetMetamodel;
    const sourcemodelview = context.myCurrentModelview;
    const sourcemodel = context.myModel;
    if (debug) console.log('675 metamodel, modelview, context', targetmetamodel, sourcemodelview, context, );
    if (!targetmetamodel)
        return false;
    if (!sourcemodelview)
        return false;
    const myMetis = context.myMetis;
    let currentNode = context.myCurrentNode;
    // const currentMetamodel = myMetis.currentMetamodel;
    // const currentModel = myMetis.currentModel;
    // myMetis.targetMetamodelRef = targetmetamodel?.id;
    // currentModel.targetMetamodelRef = targetmetamodel?.id;
    // const modelview = sourcemodelview;
    // const model = sourcemodelview.model;  // Concept model
    if (debug) console.log('688 myMetis', myMetis);
    let objectviews = sourcemodelview.objectviews;
    let relshipviews = sourcemodelview.relshipviews;
    if (currentNode) {
        if (debug) console.log('692 currentNode, myGoModel', currentNode, context.myGoModel);
        currentNode = context.myGoModel.findNode(currentNode.key);
        objectviews = currentNode.getGroupMembers2(context.myGoModel);
        relshipviews = currentNode.getGroupLinkMembers2(context.myGoModel);
    }
    if (debug) console.log('697 objviews, relviews', objectviews, relshipviews, context);
    generateMetamodel(objectviews, relshipviews, context);
    if (debug) console.log('699 myMetis', myMetis);
    // Look up the relationships between Roles and Tasks
        // For each relship, get relship type and add to metamodel
    // Look up the relationships between Tasks and Informations
        // For each relship, get relship type and add to metamodel

    alert("Target metamodel has been successfully generated!");
    // context.myMetamodel = currentMetamodel;
    return true;
}

export function generateMetamodel(objectviews: akm.cxObjectView[], relshipviews: akm.cxRelationshipView[], context: any) {
    if (debug) console.log('712 objectviews, relshipviews, context', objectviews, relshipviews, context);
    const myMetis     = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const model       = context.myModel;
    const metamodel   = context.myTargetMetamodel;
    const myDiagram   = context.myDiagram;
    const modifiedTypeNodes    = new Array();
    const modifiedObjTypeViews = new Array();
    const modifiedGeos         = new Array();
    const modifiedTypeLinks    = new Array();
    const modifiedRelTypeViews = new Array();
    const modifiedMetamodels   = new Array();

    if (!metamodel)
        return;
        
    model.targetMetamodelRef = metamodel.id;

    let objects = model?.getObjectsByTypename('Datatype', false);
    // For each Datatype object call generateDatatype
    if (objects) {
        for (let i=0; i<objects.length; i++) {
            let obj = objects[i];
            if (obj && !obj.markedAsDeleted)
                generateDatatype(obj, context);
        }
    }
    objects = model?.getObjectsByTypename('Method', false);
    // For each Method object call generateMethod
    if (objects) {
        for (let i=0; i<objects.length; i++) {
            let obj = objects[i];
            if (obj && !obj.markedAsDeleted)
                generateMethod(obj, context);
        }
    }

    // Add system datatypes
    const dtypes = ['cardinality', 'viewkind', 'relshipkind', 'fieldtype', 
                    'layout', 'routing', 'linkcurve',
                    'integer', 'string', 'number', 'boolean', 'date'];
    for (let i=0; i<dtypes.length; i++) {
        const dtype = dtypes[i];
        const datatype = myMetis.findDatatypeByName(dtype);
        if (datatype)
            metamodel.addDatatype(datatype);
    }
    // Add system types 
    // First object types
    const systemtypes = ['Element', 'Entity','Generic', 'Container'];
    let objtypes;
    if (model.includeSystemtypes) {
        objtypes = myMetamodel.objecttypes;
    } else {
        objtypes = [];
        for (let i=0; i<systemtypes.length; i++) {
            const typename = systemtypes[i];
            const type = myMetamodel.findObjectTypeByName(typename);
            objtypes.push(type);
        }
    }
    for (let i=0; i<objtypes.length; i++) {
        const typename = objtypes[i].name;
        const objtype = myMetamodel.findObjectTypeByName(typename);
        if (debug) console.log('846 objtype', objtype, myMetis);
        if (objtype) {
            metamodel.addObjectType(objtype);
            metamodel.addObjectTypeView(objtype.typeview);
            let geo = new akm.cxObjtypeGeo(utils.createGuid(), metamodel, objtype, "", "");
            metamodel.addObjtypeGeo(geo);
            const gqlObjTypegeo = new gql.gqlObjectTypegeo(geo);
            if (debug) console.log('842 Generate Object Type', gqlObjTypegeo, myMetis);
            modifiedGeos.push(gqlObjTypegeo);
        }
    }
    if (debug) console.log('857 system object types completed', myMetis);
    // Then relationship types
    const rsystemtypes = ['isRelatedTo', 'Is', 'hasPart', 'hasMember'];
    let reltypes;
    if (model.includeSystemtypes) {
        reltypes = myMetamodel.relshiptypes;
        if (debug) console.log('863 reltypes', reltypes);
    } else {
        reltypes = [];
        for (let i=0; i<rsystemtypes.length; i++) {
            const rtypename = rsystemtypes[i];
            if (debug) console.log('868 typename', rtypename);
            const rtypes = myMetamodel.findRelationshipTypesByName(rtypename);
            for (let j=0; j<rtypes?.length; j++) {
                const rtype = rtypes[j];
                const fromtype = rtype.fromObjtype;
                for (let k=0; k<objtypes.length; k++) {
                    if (fromtype.id === objtypes[k].id) {
                        const totype = rtype.toObjtype;
                        for (let l=0; l<objtypes.length; l++) {
                            if (totype.id === objtypes[l].id) {
                                reltypes.push(rtype);
                            }
                        }
                    }
                }
            }
        }
    }
    for (let i=0; i<reltypes.length;i++) {
        const reltype = reltypes[i];
        if (reltype) {
            metamodel.addRelationshipType(reltype);
            if (debug) console.log('794 reltype', reltype);
        }
    }
    if (debug) console.log('893 system relship types completed', myMetis);
    // Add or generate objecttypes
    // const metaObject = 'Information';
    let metaObject;
    const metaObjects = ['Entity'];
    for (let i=0; i<metaObjects.length; i++) {
        const mObject = metaObjects[i];
        const mType = myMetamodel.findObjectTypeByName(mObject);
        if (mType) {
            metaObject = mObject;
            break;
        }
    }
    if (debug) console.log('906 objectviews', objectviews);
    if (objectviews) {
        for (let i=0; i<objectviews.length; i++) {
            const objview = objectviews[i];
            if (!objview || objview.markedAsDeleted) 
                continue;
            let obj = objview.object;
            if (!obj || obj.markedAsDeleted) 
                continue;
            const  types = []; 
            if (obj.name === obj.type.name)
                types.push(obj.type.name);
            types.push(metaObject);
            for (let i=0; i<types.length; i++) {
                if (debug) console.log('830 i, obj, type', i, obj, types[i]);
                const type = myMetamodel.findObjectTypeByName(types[i]);
                if (debug) console.log('832 type, obj', type, obj);
                if (type && obj && obj.type) {
                    if (type.markedAsDeleted)
                        continue;
                    // Check if obj inherits one of the specified types - otherwise do not generate type
                    if (obj.type.inherits(type, myMetis.allRelationshiptypes)) {
                        if (debug) console.log('838 obj', obj.name, obj);
                        let objtype;
                        if ((obj.name === obj.type.name) || (obj.type.name === metaObject)) { 
                            if (debug) console.log('841 obj, objview', obj, objview);                       
                            objtype = generateObjectType(obj, objview, context);
                            if (debug) console.log('843 objtype', objtype);   
                            if (objtype) metamodel.addObjectType(objtype);
                            const typeview = objtype?.typeview;
                            if (typeview) metamodel.addObjectTypeView(typeview); 
                            if (debug) console.log('847 typeview, metamodel', typeview, metamodel);
                        }
                    }
                }
            }
        }
    }
    if (debug) console.log('944 objectviews completed', myMetis);
    // Add or generate relationship types
    if (relshipviews) {
        if (debug) console.log('850 relshipviews', relshipviews);
        // return;
        for (let i=0; i<relshipviews.length; i++) {
            const relview = relshipviews[i];
            if (debug) console.log('852 relview', relview);
            if (!relview) continue;
            const rel = relview.relship;
            const fromObjview = relview.fromObjview;
            if (!fromObjview) continue;
            const fromObj = fromObjview?.object;
            const toObjview = relview.toObjview;
            if (!toObjview) continue;
            const toObj = toObjview?.object;
            if (debug) console.log('863 relview', relview);
            if ((fromObj?.type.name === metaObject) && (toObj?.type.name === metaObject)) {
                if (debug) console.log('863 rel', rel);
                const reltype = generateRelshipType(rel, relview, context);
                if (debug) console.log('867 reltype', reltype);
                // Prepare dispatches
                if (reltype) {
                    const gqlRelshipType = new gql.gqlRelationshipType(reltype, true);
                    if (debug) console.log('871 Generate Relationship Type', reltype, gqlRelshipType);
                    const modifiedTypeLinks = new Array();
                    modifiedTypeLinks.push(gqlRelshipType);
                    const relTypeview = reltype.typeview;
                    if (relTypeview) {
                        const gqlRelTypeview = new gql.gqlRelshipTypeView(relTypeview);
                        if (debug) console.log('877 Generate Reltypeview', gqlRelTypeview);
                        modifiedRelTypeViews.push(gqlRelTypeview);
                    }
                }
            }
        }
    }
    if (debug) console.log('981 relshipviews completed', myMetis);
    // Prepare dispatch of the metamodel and the current model
    const gqlMetamodel = new gql.gqlMetaModel(metamodel, true);
    modifiedMetamodels.push(gqlMetamodel);
    if (debug) console.log('985 Target metamodel', metamodel, gqlMetamodel);

    if (true) { // Do the dispatches
        modifiedTypeNodes.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPE_PROPERTIES', data })
        });
        if (debug) console.log('993 myMetis', modifiedTypeNodes); 
        modifiedObjTypeViews?.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES', data })
        })
        if (debug) console.log('958 myMetis', modifiedObjTypeViews); 
        modifiedGeos?.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES', data })
        })
        if (debug) console.log('1005 myMetis', modifiedGeos, myMetis);
        modifiedTypeLinks.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
        });
        modifiedRelTypeViews?.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES', data })
        })
        modifiedMetamodels.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            if (debug) console.log('917 gqlMetamodel', data);
            myDiagram.dispatch({ type: 'UPDATE_TARGETMETAMODEL_PROPERTIES', data });
        });
    }
}

function getAllPropertytypes(obj: akm.cxObject, proptypes: any, myModel: akm.cxModel) {
    // Check if obj inherits another obj
    const genrels = obj?.findOutputRelships(myModel, constants.relkinds.GEN);
    if (genrels) {
        for (let i=0; i<genrels.length; i++) {
            const rel = genrels[i];
            const toObj = rel?.toObject as akm.cxObject;
            if (toObj) {
                getAllPropertytypes(toObj, proptypes, myModel);
            }
        }
    }
    const rels = obj?.findOutputRelships(myModel, constants.relkinds.REL);
    for (let i=0; i<rels?.length; i++) {
        const rel = rels[i];
        const toObj = rel?.getToObject();
        if (debug) console.log('942 toObj', toObj);
        if (toObj.type?.name === constants.types.AKM_PROPERTY) {
            const proptype = rel?.getToObject();
            // Check if property type already exists
            for (let j=0; j<proptypes.length; j++) {
                if (proptype.name === proptypes[j].name)
                    continue;
            }
            if (debug) console.log('950 proptype', proptype);
            proptypes.push(proptype);
        }
    }    
}