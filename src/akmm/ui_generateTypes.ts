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
    const myMetamodel = context.myMetamodel;
    const myModel     = context.myModel;
    const myTargetMetamodel = context.myTargetMetamodel;
    if (!object) {
        return;
    }
    if (debug) console.log('168 myMetis', myMetis);
    const obj = myMetis.findObject(object.id);
    let objtype = myTargetMetamodel?.findObjectTypeByName(obj.name);
    // Handle objects of type 'Information'
    if (obj.type.name === 'Information') {
        const types = ['Role', 'Task', 'View', 'Query'];
        for (let i=0; i<types.length; i++) {
            const typename = types[i];
            if (obj.name === typename) {
                // If name === one of types, 
                // check if it already is part of the target metamodel
                objtype = myTargetMetamodel?.findObjectTypeByName(typename);
                if (debug) console.log('180 objtype', objtype);
                if (!objtype) {
                    // If not, find the type in the IRTV metamodel
                    const irtvMetamodel = myMetis.findMetamodelByName('IRTV Metamodel');
                    objtype = irtvMetamodel?.findObjectTypeByName(typename);    
                    if (debug) console.log('185 objtype', objtype);
                    if (objtype) {
                        // Generate a copy of the IRTV type
                        const otype = new akm.cxObjectType(utils.createGuid(), objtype.name, objtype.description);
                        otype.typeview = objtype.typeview;
                        otype.properties = objtype.properties;
                        otype.allObjecttypes = myMetis.objecttypes;
                        otype.allRelationshiptypes = myMetis.relshiptypes;
                        objtype = otype;
                        myTargetMetamodel.addObjectType(objtype);               
                        myMetis.addObjectType(objtype);
                        if (debug) console.log('194 objtype', objtype, myMetis);
                    }
                }
            }
        }

        const proptypes  = new Array();
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
            if (debug) console.log('191 myMetis', myMetis);
            // Create objecttypeview
            const id = utils.createGuid();
            const objtypeview = new akm.cxObjectTypeView(id, id, objtype, obj.description);
            objtypeview.applyObjectViewParameters(objview);
            if (debug) console.log('196 generateObjectType', objtypeview);
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
            if (debug) console.log('209 generateObjectType', myMetis);
        } else {
            // To ensure that objtype is a class instance
            objtype = myMetis.findObjectType(objtype.id);
        }
        if (debug) console.log('213 myMetis', objtype, myMetis);
        let parentType: akm.cxObjectType | null = null;
        let parentRelType: akm.cxRelationshipType | null = null;
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
                parentRelType.setModified(true);
                parentRelType.setRelshipKind('Generalization');
                myMetamodel.addRelationshipType(parentRelType);
                myTargetMetamodel.addRelationshipType(parentRelType);
                myMetis.addRelationshipType(parentRelType);
            }
            if (debug) console.log('221 objtype, parentType, parentRelType', objtype, parentType, parentRelType);
            if (debug) console.log('222 generateObjectType', myMetis);
            
            // Find properties connected to current object
            const rels = obj?.findOutputRelships(myModel, constants.relkinds.REL);
            if (debug) console.log('225 rels to properties', rels);
            if (!rels) {
                return null;
            } else {
                for (let i=0; i < rels.length; i++) {
                    let rel = rels[i];
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
        if (debug) console.log('256 generateObjectType', proptypes);
        // Handle properties
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
            if (debug) console.log('325 prop && target metamodel', prop, myTargetMetamodel);
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
                        // myTargetMetamodel?.addProperty(prop);
                        // myMetis.addProperty(prop); 
                    }                           
                }
            }
        }
        if (!objtype)
            return objtype;

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

        const gqlRelshipType = new gql.gqlRelationshipType(parentRelType, true);
        if (debug) console.log('404 Generate Relationship Type', parentRelType, gqlRelshipType);
        const modifiedTypeLinks = new Array();
        modifiedTypeLinks.push(gqlRelshipType);
        modifiedTypeLinks.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
        });
        if (debug) console.log('411 myMetis', modifiedTypeLinks, myMetis); 
        return objtype;
    }
}

export function generateRelshipType(relship: akm.cxRelationship, relview: akm.cxRelationshipView, context: any) {
    const myDiagram   = context.myDiagram;
    const myMetis     = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const myModel     = context.myModel;
    const myTargetMetamodel = context.myTargetMetamodel;
    if (!relship) {
        return;
    }
    const rel  = myMetis.findRelationship(relship.id);
    const fromObj  = rel.getFromObject();
    const fromtype = myTargetMetamodel.findObjectTypeByName(fromObj?.name);
    const toObj    = rel.getToObject();
    const totype   = myTargetMetamodel.findObjectTypeByName(toObj?.name);
    const relname  = rel.getName();
    let reltype    = myTargetMetamodel.findRelationshipTypeByName2(relname, fromtype, totype);
    if (debug) console.log('451 reltype', relname, reltype);
    if (!reltype) {
        // New relationship type - Create it
        reltype = new akm.cxRelationshipType(utils.createGuid(), relname, fromtype, totype, rel.description);
        myTargetMetamodel.addRelationshipType(reltype);
        myMetis.addRelationshipType(reltype);
        if (debug) console.log('373 reltype', reltype);
        // Create relationship typeview
        let reltypeview = new akm.cxRelationshipTypeView(utils.createGuid(), rel.name, reltype, rel.description);
        reltypeview.applyRelationshipViewParameters(relview);
        reltype.typeview = reltypeview;
        myTargetMetamodel.addRelationshipTypeView(reltypeview);
        myMetis.addRelationshipTypeView(reltypeview);
        if (debug) console.log('464 reltypeview', reltypeview);

        const gqlRelshipType = new gql.gqlRelationshipType(reltype);
        if (debug) console.log('466 Generate Relationship Type', reltype, gqlRelshipType);
        const modifiedTypeLinks = new Array();
        modifiedTypeLinks.push(gqlRelshipType);
        modifiedTypeLinks.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
        });
        const gqlRelTypeview = new gql.gqlRelshipTypeView(reltypeview);
        if (debug) console.log('475 Generate Relationship Type', gqlRelTypeview);
        const modifiedTypeViews = new Array();
        modifiedTypeViews.push(gqlRelTypeview);
        modifiedTypeViews?.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES', data })
        })
        return reltype;
    }
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
        datatype = new akm.cxDatatype(utils.createGuid(), name, descr);
        myTargetMetamodel.addDatatype(datatype);
        myMetis.addDatatype(datatype);        
    }
    if (debug) console.log('410 datatype', datatype);
    if (datatype) {
        // Check if it has a parent datatype
        const rels = object.findOutputRelships(myModel, constants.relkinds.REL);
        if (debug) console.log('414 rels', rels);
        if (rels) {
            let values  = new Array();
            for (let i=0; i < rels.length; i++) {
                const rel = rels[i];
                const parentObj = rel.toObject;
                if (debug) console.log('420 parentObj', parentObj);
                const parentType = parentObj.type;
                if (debug) console.log('422 parentType', parentType);
                if (parentType.name === constants.types.AKM_DATATYPE) {
                    if (debug) console.log('424 rel', rel);
                    let parentDtype = myMetis.findDatatypeByName(parentObj.name);
                    if (debug) console.log('342651 dtype', parentDtype);
                    datatype.setIsOfDatatype(parentDtype);
                }
            }  
            // Find allowed values if any
            if (debug) console.log('431 rels', rels);
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
                else if (rel.getName() === constants.types.AKM_HAS_INPUTPATTERN) {
                    let valueObj = rel.toObject;
                    datatype.setInputPattern(valueObj.name);
                }
                else if (rel.getName() === constants.types.AKM_HAS_VIEWFORMAT) {
                    let valueObj = rel.toObject;
                    datatype.setValueFormat(valueObj.name);
                }
                for (let i=0; i< values.length; i++) {
                    datatype.addAllowedValue(values[i]);
                }
            }
        }
        myTargetMetamodel.addDatatype(datatype);
        // Update phData
        const gqlDatatype = new gql.gqlDatatype(datatype);
        if (debug) console.log('455 gqlDatatype', gqlDatatype);
        const modifiedDatatypes = new Array();
        modifiedDatatypes.push(gqlDatatype);
        modifiedDatatypes.map(mn => {
            let data = (mn) && mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_DATATYPE_PROPERTIES', data })
        });

        if (debug) console.log('463 generateDatatype', datatype, myMetis);
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
    const myDiagram = context.myDiagram;
    context.myMetamodel = metamodel; 
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
    const objectviews = modelview.objectviews;
    if (objectviews) {
        for (let i=0; i<objectviews.length; i++) {
            const objview = objectviews[i];
            if (!objview) 
                continue;
            let obj = objview.object;
            const  types = ['Information', 'Role', 'Task', 'View', 'Query', 'Property']; // + Property ??
            for (let i=0; i<types.length; i++) {
                const type = myMetis.findObjectTypeByName(types[i]);
                if (obj && obj.type) {
                    // Check if obj inherits one of the specified types - otherwise do not generate type
                    if (obj.type.inherits(type)) {
                        if (debug) console.log('555 obj', obj.name, obj);
                        const objtype = generateObjectType(obj, objview, context);
                        if (objtype) {
                            if (debug) console.log('558 objtype', objtype.name, objtype);
                            // Generate GQL
                            const gqlObjectType = new gql.gqlObjectType(objtype);
                            if (debug) console.log('561 Generate Object Type', gqlObjectType);
                            modifiedTypeNodes.push(gqlObjectType);

                            const gqlObjTypeview = new gql.gqlObjectTypeView(objtype.typeview);
                            if (debug) console.log('565 Generate Object Type', gqlObjTypeview);
                            modifiedTypeViews.push(gqlObjTypeview);

                            let geo = context.myTargetMetamodel.findObjtypeGeoByType(objtype);
                            if (!geo) 
                                geo = new akm.cxObjtypeGeo(utils.createGuid(), metamodel, objtype);
                            const gqlObjTypegeo = new gql.gqlObjectTypegeo(geo);
                            if (debug) console.log('571 Generate Object Type', gqlObjTypegeo, myMetis);
                            modifiedGeos.push(gqlObjTypegeo);
                        }
                    }
                }
            }

            // Generate datatypes
            const dtype = myMetis.findObjectTypeByName('Datatype');
            if (obj && obj.type) {
                if (obj.type.inherits(dtype)) {
                    const datatype = generateDatatype(obj, context);
                    if (debug) console.log('565 objtype', datatype);
                }
            }
            // Then handle  the Unittype objects
            // To be done
        }
    }

    modifiedTypeNodes.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPE_PROPERTIES', data })
    });
    if (debug) console.log('468 myMetis', modifiedTypeNodes); 
    modifiedTypeViews?.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES', data })
    })
    if (debug) console.log('468 myMetis', modifiedTypeViews); 
    // For each valid relationship call generateRelshipType
    const relshipviews = modelview.relshipviews;
    if (debug) console.log('648 relshipviews', relshipviews);
    if (relshipviews) {
        for (let i=0; i<relshipviews.length; i++) {
            const relview = relshipviews[i];
            if (debug) console.log('652 relview', relview);
            if (!relview) continue;
            const fromObjview = relview.fromObjview;
            if (!fromObjview) continue;
            const fromObj = fromObjview?.object;
            const toObjview = relview.toObjview;
            if (!toObjview) continue;
            const toObj = toObjview?.object;
            if ((fromObj?.type.name == 'Information') && (toObj?.type.name == 'Information')) {
                const rel = relview.relship;
                if (debug) console.log('662 rel', rel);
                const reltype = generateRelshipType(rel, relview, context);
                if (debug) console.log('664 reltype', reltype);
                if (reltype) {
                    const reltypeview = reltype.typeview;
                    // Generate GQL
                    const gqlRelshipType = new gql.gqlRelationshipType(reltype);
                    if (debug) console.log('669 Generate Relationship Type', reltype, gqlRelshipType);
                    const modifiedTypeLinks = new Array();
                    modifiedTypeLinks.push(gqlRelshipType);
                    modifiedTypeLinks.map(mn => {
                        let data = (mn) && mn;
                        data = JSON.parse(JSON.stringify(data));
                        myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
                    });
                    const gqlRelTypeview = new gql.gqlRelshipTypeView(reltypeview);
                    if (debug) console.log('614 Generate Relationship Type', gqlRelTypeview);
                    const modifiedTypeViews = new Array();
                    modifiedTypeViews.push(gqlRelTypeview);
                    modifiedTypeViews?.map(mn => {
                        let data = (mn) && mn;
                        data = JSON.parse(JSON.stringify(data));
                        myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES', data })
                    })
                }
            }
        }
    }

    // Add system types 
    const objtypes = ['Container', 'Information', 'Property', 'Datatype'];
    for (let i=0; i<objtypes.length; i++) {
        const typename = objtypes[i];
        const objtype = myMetis.findObjectTypeByName(typename);
        if (objtype) {
            metamodel.addObjectType(objtype);
            metamodel.addObjectTypeView(objtype.typeview);
            let geo = metamodel.findObjtypeGeoByType(objtype);
            if (!geo) 
                geo = new akm.cxObjtypeGeo(utils.createGuid(), metamodel, objtype);
            const gqlObjTypegeo = new gql.gqlObjectTypegeo(geo);
            if (debug) console.log('571 Generate Object Type', gqlObjTypegeo, myMetis);
            modifiedGeos.push(gqlObjTypegeo);
        }
    }

    modifiedGeos?.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES', data })
    })
    if (debug) console.log('487 myMetis', modifiedGeos, myMetis);

    const gqlMetamodel = new gql.gqlMetaModel(metamodel, true);
    if (debug) console.log('700 Target metamodel', metamodel, gqlMetamodel);
    const modifiedMetamodels = new Array();
    modifiedMetamodels.push(gqlMetamodel);
    modifiedMetamodels.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_TARGETMETAMODEL_PROPERTIES', data });
    });

    if (debug) console.log('709 generateObjectType', modifiedMetamodels);

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
        if (objtype.getName() === 'Query') selection.push(objview);
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
