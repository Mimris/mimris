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
                metamodel = new akm.cxMetaModel(utils.createGuid(), mmname, "");
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
    const myDiagram = context.myDiagram;
    if (debug) console.log('102 myTargetMetamodel', myDiagram, myTargetMetamodel);
    let mmlist = "";
    for (let i=0; i<metamodels.length; i++) {
        const mm = metamodels[i];
        if (mm.name === 'IRTV Metamodel')
            continue;
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
        let metamodel = myMetis.findMetamodelByName(mmname); 
        if (create && metamodel) {
            alert("Target Metamodel already exists");
            return;
        } else if (!create && !metamodel) {
            alert("Target metamodel does not exist!");
            return;
        }
        if (debug) console.log('134 askForTargetMetamodel', myMetis);
        if (create && !metamodel) {
            if (confirm("Create new targetmetamodel '" + mmname + "' ?")) {
                metamodel = new akm.cxMetaModel(utils.createGuid(), mmname, "");
                myMetis.addMetamodel(metamodel);

                const gqlMetamodel = new gql.gqlMetaModel(metamodel, false);
                if (debug) console.log('152 Target metamodel', gqlMetamodel);
                const modifiedMetamodels = new Array();
                modifiedMetamodels.push(gqlMetamodel);
                modifiedMetamodels.map(mn => {
                    let data = (mn) && mn;
                    data = JSON.parse(JSON.stringify(data));
                    myDiagram.dispatch({ type: 'UPDATE_TARGETMETAMODEL_PROPERTIES', data });
                });
    
            } else {
                alert("Operation was cancelled!");
                return;
            }            
        }
        if (debug) console.log('154 myMetis', myMetis);
        const currentTargetMetamodel = metamodel;
        if (currentTargetMetamodel) {
            myMetis.currentTargetMetamodel = currentTargetMetamodel;
            // Update current Model with targetMetamodelRef
            myMetis.currentModel.targetMetamodelRef = currentTargetMetamodel?.id;

            const gqlModel = new gql.gqlModel(myMetis.currentModel, true);
            if (debug) console.log('822 current model', gqlModel, myMetis.currentModelview);
            const modifiedModels = new Array();
            modifiedModels.push(gqlModel);
            modifiedModels.map(mn => {
                let data = (mn) && mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
            })
            if (debug) console.log('829 current model', gqlModel);

            // gqlMetamodel = (context.myMetamodel) && new gql.gqlMetaModel(currentTargetMetamodel, false);
            // if (debug) console.log('174 set target Metamodel', gqlMetamodel);
        }
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
    let parentRelType: akm.cxRelationshipType | null = null;
    if (debug) console.log('187 object, objview', object, objview);
    if (!object) {
        return;
    }
    if (debug) console.log('191 context', context);
    const typid = object.generatedTypeId;
    if (debug) console.log('193 typid', typid, typid.length);
    const obj = myMetis.findObject(object.id);
    let newName  = object?.name;
    let oldName = "";
    newName = utils.camelize(newName);
    newName = utils.capitalizeFirstLetter(newName);
    let objname = newName;
    if (debug) console.log('203 newName', newName);
    let objtype;
    if (typid) { // The object type exists - has been generated before
        objtype = myMetis.findObjectType(typid);
        oldName = objtype?.getName();
        objtype?.setName(newName);
    } else {
        // Check if the types has not been generated, but exists anyway
        objtype = myTargetMetamodel?.findObjectTypeByName(obj.name);
        if (debug) console.log('210 obj, objtype', obj, objtype);
    }
    if (!objtype) { // This is a new object type
        if (obj.type.name === 'Information') {
            const types = ['Role', 'Task', 'View', 'Query'];
            for (let i=0; i<types.length; i++) {
                const typename = types[i];
                if (obj.name === typename) {
                    // If name === one of given types, 
                    // check if it already is part of the target metamodel
                    objtype = myTargetMetamodel?.findObjectTypeByName(typename);
                    if (debug) console.log('204 objtype', objtype);
                    if (!objtype) {
                        // If not, find the type in the IRTV metamodel
                        const irtvMetamodel = myMetis.findMetamodelByName('IRTV Metamodel');
                        objtype = irtvMetamodel?.findObjectTypeByName(typename);    
                        if (debug) console.log('209 objtype', objtype);
                        if (objtype) {
                            // Generate a copy of the IRTV type
                            const otype = new akm.cxObjectType(utils.createGuid(), objtype.name, objtype.description);
                            otype.typeview = objtype.typeview;
                            if (debug) console.log('214 objview, typeview', objview, otype.typeview);
                            objtype = otype;
                        }
                    }
                    if (objtype) {
                        objtype.typeview?.applyObjectViewParameters(objview);
                        if (debug) console.log('220 typeview', objview, objtype.typeview);
                        objtype.properties = objtype.properties;
                        // objtype.allObjecttypes = myMetis.objecttypes;
                        // objtype.allRelationshiptypes = myMetis.relshiptypes;
                        myTargetMetamodel.addObjectType(objtype);               
                        myMetis.addObjectType(objtype);
                        if (debug) console.log('226 objtype', objtype, objtype.typeview);                    
                    }
                }
            }
            if (!objtype) {     // New object type - Create it                
                let name = objname;
                if (debug) console.log('237 name', name);
                objtype = new akm.cxObjectType(utils.createGuid(), name, obj.description);
                const properties = obj?.type?.properties;
                if (properties !== undefined && properties !== null && properties.length > 0)
                    objtype.properties = properties;
                else
                    objtype.properties = new Array();
                myTargetMetamodel?.addObjectType(objtype);
                myMetis.addObjectType(objtype);
                object.generatedTypeId = objtype.getId();
                const gqlObject = new gql.gqlObject(object);
                modifiedObjects.push(gqlObject);        
                if (debug) console.log('266 object, gqlObject: ', object, gqlObject);
                if (debug) console.log('267 objtype', objtype);
                // Create objecttypeview
                const id = utils.createGuid();
                const objtypeview = new akm.cxObjectTypeView(id, id, objtype, obj.description);
                objtypeview.applyObjectViewParameters(objview);
                if (debug) console.log('250 objtypeview, objview', objtypeview, objview);
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
                if (debug) console.log('263 myMetis', myMetis);
            } else {
                // To ensure that objtype is a class instance
                objtype = myMetis.findObjectType(objtype.id);
                const typeview = objtype.typeview;
                if (debug) console.log('268 objview, typeview', objview, typeview);
                typeview?.applyObjectViewParameters(objview);
                if (debug) console.log('270 typeview', typeview);
            }
            if (debug) console.log('272 objtype, myMetis', objtype, myMetis);
            let parentType: akm.cxObjectType | null = null;
            if (objtype) {
                objtype.setModified(true);
                const types = ['Role', 'Task', 'View', 'Query', 'Property', 'Container'];
                for (let i=0; i<types.length; i++) {
                    const typename = types[i];
                    if (obj.name === typename) {
                        parentType = myMetis.findObjectTypeByName(typename);
                    }
                }
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
                if (debug) console.log('288 objtype, parentType, parentRelType', objtype, parentType, parentRelType);
                if (debug) console.log('289 generateObjectType', myMetis);
                
                // // Find properties connected to current object
                // const rels = obj?.findOutputRelships(myModel, "");
                // if (debug) console.log('293 rels to properties', obj, rels);
                // if (!rels) {
                //     return null;
                // } else {
                //     for (let i=0; i < rels.length; i++) {
                //         let rel = rels[i];
                //         if (rel.toObject?.type.name === constants.types.AKM_PROPERTY) {
                //             if (rel.name === constants.types.AKM_HAS_PROPERTY) {
                //                 const proptype = rel.getToObject();
                //                 if (debug) console.log('302 proptype', proptype);
                //                 // Check if property type already exists
                //                 for (let j=0; j<proptypes.length; j++) {
                //                     if (proptype.name === proptypes[j].name)
                //                         continue;
                //                 }
                //                 if (debug) console.log('308 proptype', proptype);
                //                 proptypes.push(proptype);
                //             }
                //         }
                //     }
                // }
            }  
        }
    }
    if (!objtype)
        return objtype;

    // Handle properties
    const proptypes  = new Array();
    // Find properties connected to current object
    const rels = obj?.findOutputRelships(myModel, constants.relkinds.REL);
    if (!rels) {
        return null;
    } else {
        for (let i=0; i < rels.length; i++) {
            let rel = rels[i];
            if (rel.name === constants.types.AKM_HAS_PROPERTY) {
                const proptype = rel.getToObject();
                // Check if property type already exists
                for (let j=0; j<proptypes.length; j++) {
                    if (proptype.name === proptypes[j].name)
                        continue;
                }
                proptypes.push(proptype);
            }
        }
    }
    if (debug) console.log('364 generateObjectType', proptypes);
    for (let i=0; i < proptypes.length; i++) {
        // Check if property already exists
        let proptype = proptypes[i];
        let prop = objtype.findPropertyByName(proptype.name);
        if (!prop) {
            prop = myTargetMetamodel.findPropertyByName(proptype.name);
            if (!prop) {
                // New property - create it
                prop = new akm.cxProperty(utils.createGuid(), proptype.name, proptype.description);
                let datatype = myMetis.findDatatypeByName("string");
                prop.setDatatype(datatype);
                objtype.addProperty(prop);
                myTargetMetamodel.addProperty(prop);
                myMetis.addProperty(prop);
            }
        } else {
            prop = myMetis.findProperty(prop.id);
            myTargetMetamodel.addProperty(prop);
        }
        if (debug) console.log('357 prop && target metamodel', prop, myTargetMetamodel);
        if (prop) {
            // Find datatype connected to current property
            let rels = proptype.findOutputRelships(myModel, constants.relkinds.REL);
            if (debug) console.log('361 rels', rels);
            if (rels) {
                for (let i=0; i < rels.length; i++) {
                    let rel = rels[i];
                    if (!rel.markedAsDeleted) {
                        if (rel.name === constants.types.AKM_IS_OF_DATATYPE) {
                            let dtype = rel.toObject;
                            if (dtype) {
                                let datatype = myTargetMetamodel.findDatatypeByName(dtype.name);
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

    // Do the dispatches
    const props = objtype.properties;
    const modifiedProps = new Array();
    for (let i=0; i<props?.length; i++) {
        const gqlProperty = new gql.gqlProperty(props[i]);
        modifiedProps.push(gqlProperty);
    }
    if (modifiedProps?.length > 0) {
        modifiedProps.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_PROPERTY_PROPERTIES', data })
        });
        if (debug) console.log('367 modifiedProps', modifiedProps);
    }

    const gqlObjectType = new gql.gqlObjectType(objtype, true);
    if (debug) console.log('372 Generate Object Type', gqlObjectType);
    const modifiedTypeNodes = new Array();
    modifiedTypeNodes.push(gqlObjectType);
    modifiedTypeNodes.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPE_PROPERTIES', data })
    });
    if (debug) console.log('324 myMetis', modifiedTypeNodes, myMetis);

    const gqlObjTypeview = new gql.gqlObjectTypeView(objtype.typeview);
    if (debug) console.log('382 Generate Object Type', gqlObjTypeview);
    const modifiedTypeViews = new Array();
    modifiedTypeViews.push(gqlObjTypeview);
    modifiedTypeViews?.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES', data })
    })

    const geo = myTargetMetamodel.findObjtypeGeoByType(objtype);
    if (geo) {
        const gqlObjTypegeo = new gql.gqlObjectTypegeo(geo);
        if (debug) console.log('338 Generate Object Type', gqlObjTypegeo, myMetis);
        const modifiedGeos = new Array();
        modifiedGeos.push(gqlObjTypegeo);
        modifiedGeos?.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES', data })
        })
        if (debug) console.log('345 myMetis', modifiedGeos, myMetis);
    }
    if (parentRelType) {
        const modifiedTypeLinks = new Array();
        const gqlRelshipType = new gql.gqlRelationshipType(parentRelType, true);
        if (debug) console.log('473 Generate Relationship Type', parentRelType, gqlRelshipType);
        modifiedTypeLinks.push(gqlRelshipType);
        modifiedTypeLinks.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
        });
        if (debug) console.log('481 myMetis', modifiedTypeLinks, myMetis);                                    // Then handle the object type
    }

    modifiedObjects?.map(mn => {
        let data = (mn) && mn 
        if (debug) console.log('484 data', data);
        myDiagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
        })
    if (debug) console.log('487 objtype', objtype);
    return objtype;
}

export function generateRelshipType(relship: akm.cxRelationship, relview: akm.cxRelationshipView, context: any) {
    if (debug) console.log('491 relship, relview: ', relship, relview);
    const myDiagram   = context.myDiagram;
    const myMetis     = context.myMetis;
    const myTargetMetamodel = context.myTargetMetamodel;
    if (!relship) {
        return;
    }
    let typid = relship.generatedTypeId;
    if (debug) console.log('496 typid', typid, typid.length);
    if (debug) console.log('500 myTargetMetamodel', myTargetMetamodel);
    const modifiedRelships = new Array();
    // relship is the relationship defining the relationship type to be generated
    const currentRel  = myMetis.findRelationship(relship.id);
    if (debug) console.log('504 currentRel: ', currentRel);
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
    if (debug) console.log('515 fromObj, toObj: ', fromObj, toObj);
    if (debug) console.log('516 fromtype, totype: ', fromtype, totype);
    let newName  = currentRel?.getName();
    let oldName = "";
    newName = utils.camelize(newName);
    newName = utils.uncapitalizeFirstLetter(newName);
    let relname = newName;
    let reltype;
    if (typid?.length > 0) {
        reltype = myMetis.findRelationshipType(typid);
        oldName = reltype?.getName();
        reltype?.setName(newName);
    }
    if (debug) console.log('522 reltype: ', reltype);
    if (!reltype) {
        // Check if reltype exists between fromtype and to type with name === newName
        if (debug) console.log('525 relname, fromtype, totype:', relname, fromtype, totype);
        reltype = myTargetMetamodel.findRelationshipTypeByName2(relname, fromtype, totype);
        if (debug) console.log('527 reltype: ', reltype);
    }
    if (!reltype) {
        // This is a new relationship type - Create it
        if (debug) console.log('537 new relship type: ', newName);
        const reltype = new akm.cxRelationshipType(utils.createGuid(), relname, fromtype, totype, currentRel.description);
        myTargetMetamodel.addRelationshipType(reltype);
        myMetis.addRelationshipType(reltype);
        currentRel.generatedTypeId = reltype.getId();
        if (debug) console.log('542 currentRel, reltype', currentRel, reltype);
        const gqlRelship = new gql.gqlRelationship(relship);
        modifiedRelships.push(gqlRelship);        
        if (debug) console.log('545 currentRel, gqlRelship: ', currentRel, gqlRelship);
        // Create relationship typeview
        const guid = utils.createGuid();
        let reltypeview = new akm.cxRelationshipTypeView(guid, guid, reltype, "");
        reltypeview.applyRelationshipViewParameters(relview);
        reltype.typeview = reltypeview;
        myTargetMetamodel.addRelationshipTypeView(reltypeview);
        myMetis.addRelationshipTypeView(reltypeview);
        if (debug) console.log('553 reltypeview', reltypeview);

        const gqlRelshipType = new gql.gqlRelationshipType(reltype, true);
        if (debug) console.log('556 Generate Relationship Type', reltype, gqlRelshipType);
        const modifiedTypeLinks = new Array();
        modifiedTypeLinks.push(gqlRelshipType);
        modifiedTypeLinks.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
        });
        const gqlRelTypeview = new gql.gqlRelshipTypeView(reltypeview);
        if (debug) console.log('565 Generate Relationship Type', gqlRelTypeview);
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
        if (debug) console.log('544 rename relship type to: ', newName);
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
        if (debug) console.log('596 data', data);
        myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
        })
    if (debug) console.log('599 reltype', reltype);
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

    let datatype   = myTargetMetamodel.findDatatypeByName(name);
    if (!datatype) {
        if (debug) console.log('524 datatype name:', name);
        const dtype = myMetis.findDatatypeByName(name);
        if (debug) console.log('526 dtype:', dtype);
        if (dtype) {
            myTargetMetamodel.addDatatype(dtype);
        } else {
            datatype = new akm.cxDatatype(utils.createGuid(), name, descr);
            myTargetMetamodel.addDatatype(datatype);
            myMetis.addDatatype(datatype);  
        }      
    }
    if (debug) console.log('528 datatype', datatype, myTargetMetamodel);
    if (datatype) {
        // Check if it has a parent datatype
        const rels = object.findOutputRelships(myModel, constants.relkinds.REL);
        if (rels) {
            if (debug) console.log('533 rels', rels);
            let values  = new Array();
            for (let i=0; i < rels.length; i++) {
                const rel = rels[i];
                const parentObj = rel.toObject;
                if (debug) console.log('538 parentObj', parentObj);
                const parentType = parentObj.type;
                if (debug) console.log('540 parentType', parentType);
                if (parentType.name === constants.types.AKM_DATATYPE) {
                    if (debug) console.log('511 rel', rel);
                    let parentDtype = myMetis.findDatatypeByName(parentObj.name);
                    if (debug) console.log('513 dtype', parentDtype);
                    datatype.setIsOfDatatype(parentDtype);
                    // Copy default values from parentDtype
                    datatype.setInputPattern(parentDtype?.inputPattern);
                    datatype.setViewFormat(parentDtype?.viewFormat);
                    datatype.setFieldType(parentDtype?.fieldType);
                }
            }  
            // Find allowed values if any
            if (debug) console.log('549 rels', rels);
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
                    if (debug) console.log('529 rels', rels);
                }
                else if (rel.getName() === constants.types.AKM_IS_DEFAULTVALUE) {
                    let valueObj = rel.toObject;
                    datatype.setDefaultValue(valueObj.name);
                    if (debug) console.log('534 defaultValue', valueObj.name);
                }
                for (let i=0; i< values.length; i++) {
                    datatype.addAllowedValue(values[i]);
                    if (debug) console.log('546 allowedValue', values[i]);
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
            if (debug) console.log('591 datatype', datatype);
            myTargetMetamodel.addDatatype(datatype);
            // Update phData
            const gqlDatatype = new gql.gqlDatatype(datatype);
            const modifiedDatatypes = new Array();
            modifiedDatatypes.push(gqlDatatype);
            if (debug) console.log('680 ui_generateTypes', gqlDatatype, modifiedDatatypes);
            modifiedDatatypes.map(mn => {
                let data = (mn) && mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_DATATYPE_PROPERTIES', data })
            });

            if (debug) console.log('604 generateDatatype', datatype, myMetis);
            return datatype;
        }
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

export function generateMetamodel(objectviews: akm.cxObjectView[], relshipviews: akm.cxRelationshipView[], context: any) {
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

    // context.myMetamodel = metamodel; 

    const objects = model?.getObjectsByTypename('Datatype', false);
    // For each Datatype object call generateDatatype
    if (objects) {
        for (let i=0; i<objects.length; i++) {
            let obj = objects[i];
            if (obj && !obj.markedAsDeleted)
                generateDatatype(obj, context);
        }
    }
    if (!debug) console.log('713 objectviews', objectviews);
    if (objectviews) {
        for (let i=0; i<objectviews.length; i++) {
            const objview = objectviews[i];
            if (!objview || objview.markedAsDeleted) 
                continue;
            let obj = objview.object;
            if (!obj || obj.markedAsDeleted) 
                continue;
            // const  types = ['Information', 'Role', 'Task', 'View', 'Query', 'Property', 'Container']; // + Property ??
            const  types = ['Information']; 
            for (let i=0; i<types.length; i++) {
                const type = myMetamodel.findObjectTypeByName(types[i]);
                if (!debug) console.log('725 type, obj', type, obj);
                if (type && obj && obj.type) {
                    if (type.markedAsDeleted)
                        continue;
                    // Check if obj inherits one of the specified types - otherwise do not generate type
                    if (obj.type.inherits(type, myMetis.allRelationshiptypes)) {
                        if (!debug) console.log('730 obj', obj.name, obj);
                        let objtype;
                        if ((obj.name === obj.type.name) || (obj.type.name === 'Information')) { 
                            if (!debug) console.log('733 obj, objview', obj, objview);                       
                            objtype = generateObjectType(obj, objview, context);
                            if (!debug) console.log('735 obj, objview', obj, objview);                       
                            metamodel.addObjectType(objtype);
                        }
                        // Prepare dispatches
                        if (objtype) {
                            if (debug) console.log('740 objtype', objtype.name, objtype);
                            // Generate GQL
                            const gqlObjectType = new gql.gqlObjectType(objtype, true);
                            if (debug) console.log('743 Generate Object Type', gqlObjectType);
                            modifiedTypeNodes.push(gqlObjectType);
                            if (objtype.typeview) {
                                const gqlObjTypeview = new gql.gqlObjectTypeView(objtype.typeview);
                                if (debug) console.log('747 Generate Object Type', gqlObjTypeview);
                                modifiedObjTypeViews.push(gqlObjTypeview);
                            }
                            let geo = metamodel.findObjtypeGeoByType(objtype);
                            if (!geo) 
                                geo = new akm.cxObjtypeGeo(utils.createGuid(), metamodel, objtype, "", "");
                            if (geo) {
                                const gqlObjTypegeo = new gql.gqlObjectTypegeo(geo);
                                if (debug) console.log('755 Generate Object Type', gqlObjTypegeo, myMetis);
                                modifiedGeos.push(gqlObjTypegeo);
                            }
                        }
                    }
                }
            }
        }
    }
    if (relshipviews) {
        if (debug) console.log('764 relshipviews', relshipviews);
        // return;
        for (let i=0; i<relshipviews.length; i++) {
            const relview = relshipviews[i];
            if (debug) console.log('767 relview', relview);
            if (!relview) continue;
            const rel = relview.relship;
            const fromObjview = relview.fromObjview;
            if (!fromObjview) continue;
            const fromObj = fromObjview?.object;
            const toObjview = relview.toObjview;
            if (!toObjview) continue;
            const toObj = toObjview?.object;
            if (debug) console.log('775 relview', relview);
            if ((fromObj?.type.name == 'Information') && (toObj?.type.name == 'Information')) {
                if (debug) console.log('778 rel', rel);
                const reltype = generateRelshipType(rel, relview, context);
                if (debug) console.log('780 reltype', reltype);
                // Prepare dispatches
                if (reltype) {
                    const gqlRelshipType = new gql.gqlRelationshipType(reltype, true);
                    if (debug) console.log('784 Generate Relationship Type', reltype, gqlRelshipType);
                    const modifiedTypeLinks = new Array();
                    modifiedTypeLinks.push(gqlRelshipType);
                    const relTypeview = reltype.typeview;
                    if (relTypeview) {
                        const gqlRelTypeview = new gql.gqlRelshipTypeView(relTypeview);
                        if (debug) console.log('789 Generate Reltypeview', gqlRelTypeview);
                        modifiedRelTypeViews.push(gqlRelTypeview);
                    }
                }
            }
        }
    }

    // Add system types 
    // First object types
    const typenames = ['Container', 'Generic', 'Property', 'Datatype', 'Value', 'ViewFormat', 'FieldType', 'InputPattern'];
    for (let i=0; i<typenames.length; i++) {
        const typename = typenames[i];
        const objtype = myMetamodel.findObjectTypeByName(typename);
        if (!debug) console.log('839 objtype', objtype, myMetis);
        if (objtype) {
            metamodel.addObjectType(objtype);
            metamodel.addObjectTypeView(objtype.typeview);
            let geo = new akm.cxObjtypeGeo(utils.createGuid(), metamodel, objtype, "", "");
            metamodel.addObjtypeGeo(geo);
            const gqlObjTypegeo = new gql.gqlObjectTypegeo(geo);
            if (debug) console.log('846 Generate Object Type', gqlObjTypegeo, myMetis);
            modifiedGeos.push(gqlObjTypegeo); 
        }
    }
    // Then add relationship types
    const reltypes = [];
    let reltype;
    reltype = {"from": "Object", "type": "has", "to": "Property"}
    reltypes.push(reltype);
    reltype = {"from": "Property", "type": "has", "to": "Value"}
    reltypes.push(reltype);
    reltype = {"from": "Property", "type": "isOf", "to": "Datatype"}
    reltypes.push(reltype);
    reltype = {"from": "Datatype", "type": "hasDefault", "to": "Value"}
    reltypes.push(reltype);
    reltype = {"from": "Datatype", "type": "hasAllowed", "to": "Value"}
    reltypes.push(reltype);
    reltype = {"from": "Datatype", "type": "has", "to": "FieldType"}
    reltypes.push(reltype);
    reltype = {"from": "Datatype", "type": "has", "to": "InputPattern"}
    reltypes.push(reltype);
    reltype = {"from": "Datatype", "type": "has", "to": "ViewFormat"}
    reltypes.push(reltype);
    const len = reltypes.length;
    if (!debug) console.log('840 len, reltypes', len, reltypes);
    for (let i=0; i<len; i++) {
        const rtype = reltypes[i];
        const fromType = myMetamodel.findObjectTypeByName(rtype.from);
        const toType = myMetamodel.findObjectTypeByName(rtype.to);
        const reltype = myMetamodel.findRelationshipTypeByName2(rtype.type, fromType, toType);
        if (!debug) console.log('845 reltype, fromType, toType', reltype, fromType, toType);
        if (reltype) {
            metamodel.addRelationshipType(reltype);
            metamodel.addRelationshipTypeView(reltype.typeview);        
        }
    }
    // Prepare dispatch of the metamodel
    if (!debug) console.log('852 Target metamodel', metamodel);
    const gqlMetamodel = new gql.gqlMetaModel(metamodel, true);
    modifiedMetamodels.push(gqlMetamodel);

    if (true) { // Do the dispatches
        modifiedTypeNodes.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPE_PROPERTIES', data })
        });
        if (debug) console.log('686 myMetis', modifiedTypeNodes); 
        modifiedObjTypeViews?.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES', data })
        })
        if (debug) console.log('692 myMetis', modifiedObjTypeViews); 
        modifiedGeos?.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES', data })
        })
        if (debug) console.log('698 myMetis', modifiedGeos, myMetis);
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
            if (!debug) console.log('889 gqlMetamodel', data);
            myDiagram.dispatch({ type: 'UPDATE_TARGETMETAMODEL_PROPERTIES', data });
        });
    }
}

export function generateTargetMetamodel(targetmetamodel: akm.cxMetaModel, sourcemodelview: akm.cxModelView, context: any) {
    if (debug) console.log('894 Context, modelview', context, sourcemodelview);
    const myMetis   = context.myMetis;
    const currentMetamodel = myMetis.currentMetamodel;
    const metamodel = targetmetamodel;
    const modelview = sourcemodelview;
    let currentNode = context.myCurrentNode;
    const myDiagram = context.myDiagram;
    if (!metamodel)
        return false;
    if (!modelview)
    return false;
    const model = modelview.model;  // Concept model
    // Generate the types defined in the concept model, 
    //  and connect them all to the metamodel:
    // For each object call generateObjectType
    const modifiedTypeNodes = new Array();
    const modifiedTypeViews = new Array();
    const modifiedGeos = new Array();
    let objectviews = modelview.objectviews;
    let relshipviews = modelview.relshipviews;
    if (currentNode) {
        if (debug) console.log('827 currentNode, myGoModel', currentNode, context.myGoModel);
        currentNode = context.myGoModel.findNode(currentNode.key);
        objectviews = currentNode.getGroupMembers2(context.myGoModel);
        relshipviews = currentNode.getGroupLinkMembers2(context.myGoModel);
    }
    if (!debug) console.log('920 objviews. relviews', objectviews, relshipviews);
    generateMetamodel(objectviews, relshipviews, context);
    if (!debug) console.log('922 myMetis', myMetis);


    // Look up the relationships between Roles and Tasks
        // For each relship, get relship type and add to metamodel
    // Look up the relationships between Tasks and Informations
        // For each relship, get relship type and add to metamodel

    alert("Target metamodel has been successfully generated!");
    context.myMetamodel = currentMetamodel;
    return true;
}

