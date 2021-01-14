// @ts-nocheck
const debug = false;

// this Kernel code

//import akm_globals from "./akm_globals";

// import AkmModelsController from "../posts/akmmodels.controller";

/*
Module:         The kernel classes
File name:      metamodeller.js
Purpose:        To implement all kernel classes in the CX Modelling Application
Description:
Classes:
Functions:      None
*/

const utils = require('./utilities');
//const glb 	    = require('./akm_globals');
const constants = require('./constants');

import * as gjs from './ui_gojs';

// cxMetis

export class cxMetis {
    repositories:       cxRepository[] | null = null;
    metamodels:         cxMetaModel[] | null = null;
    models:             cxModel[] | null = null;
    modelviews:         cxModelView[] | null = null;
    datatypes:          cxDatatype[] | null = null;
    viewformats:        cxViewFormat[] | null = null;
    inputpatterns:      cxInputPattern[] | null = null;
    enumerations:       cxEnumeration[] | null = null;
    units:              cxUnit[] | null = null;
    categories:         cxUnitCategory[] | null = null;
    properties:         cxProperty[] | null = null;
    objecttypes:        cxObjectType[] | null = null;
    relshiptypes:       cxRelationshipType[] | null = null;
    objecttypeviews:    cxObjectTypeView[] | null = null;
    objtypegeos:        cxObjtypeGeo[] | null = null;
    relshiptypeviews:   cxRelationshipTypeView[] | null = null;
    objects:            cxObject[] | null = null;
    relships:           cxRelationship[] | null = null;
    objectviews:        cxObjectView[] | null = null;
    relshipviews:       cxRelationshipView[] | null = null;
    gojsModel:          gjs.goModel | null = null;
    currentRepository:  cxRepository | null = null;
    currentMetamodel:   cxMetaModel | null = null;
    currentModel:       cxModel | null = null;
    currentModelview:   cxModelView | null = null;
    currentTargetMetamodel:     cxMetaModel | null = null;
    currentTargetModel:         cxModel | null = null;
    currentTargetModelview:     cxModelView | null = null;
    currentTemplateMetamodel:   cxModel | null = null;
    currentTemplateModel:       cxModel | null = null;
    currentTemplateModelview:   cxModelView | null = null;
    pasteViewsOnly:     boolean = false;
    deleteViewsOnly:    boolean = false;
    selectedData:       any = null;
    // Constructor
    constructor() {
    }
    importData(importedData: any, includeDeleted: boolean) {
        this.initImport(importedData, includeDeleted);
        // Handle metamodels
        const metamodels = importedData?.metamodels;
        if (metamodels && metamodels.length) {
            for (let i = 0; i < metamodels.length; i++) {
                const metamodel = metamodels[i];
                if (metamodel) this.importMetamodel(metamodel);
                if (debug) console.log('55 importData', this);
            }
        }
        if (debug) console.log('73 Imported metamodel type', this);

        // Handle models next
        const models: any[] = importedData?.models;
        if (models && models.length) {
            models.forEach(model => {
                if (model && !model.deleted)
                    this.importModel(model);
            })
        }
        
        // Handle objects 
        const objects: any[] = importedData?.objects;
        if (objects && objects.length) {
            objects.forEach(obj => {
                if (obj && !obj.deleted)
                this.importObject(obj, null);
            })
        }
        // Handle relships 
        const relships: any[] = importedData?.relships;
        if (relships && relships.length) {
            relships.forEach(rel => {
                if (rel && !rel.deleted)
                this.importRelship(rel, null);
            })
        }
        // Handle current variables
        if (importedData.currentRepositoryRef) {
            const repository = this.findRepository(importedData.currentRepositoryRef);
            if (repository)
                this.currentRepository = repository;
        }
        if (importedData.currentMetamodelRef) {
            const metamodel = this.findMetamodel(importedData.currentMetamodelRef);
            if (metamodel)
                this.currentMetamodel = metamodel;
        }
        if (importedData.currentModelRef) {
            const model = this.findModel(importedData.currentModelRef);
            if (model)
                this.currentModel = model;
        }
        if (importedData.currentModelviewRef) {
            const modelview = this.findModelView(importedData.currentModelviewRef);
            if (modelview)
                this.currentModelview = modelview;
        }
        if (importedData.currentTemplateModelRef) {
            const model = this.findModel(importedData.currentTemplateModelRef);
            if (model)
                this.currentTemplateModel = model;
        }

    }
    initImport(importedData: any, includeDeleted: boolean) {
        // Import repositories
        const repositories = importedData?.repositories;
        if (repositories && repositories.length) {
            for (let i = 0; i < repositories.length; i++) {
                const item = repositories[i];
                const repository = (item) && new cxRepository(item.id, item.name, item.description);
                if (!repository) continue;
                this.addRepository(repository);
            }
        }
        // Import metamodels
        const metamodels = importedData?.metamodels;
        if (metamodels && metamodels.length) {
            for (let i = 0; i < metamodels.length; i++) {
                const item = metamodels[i];
                if (includeDeleted || !item.deleted) { 
                    const metamodel = (item) && new cxMetaModel(item.id, item.name, item.description);
                    if (!metamodel) continue;
                    this.addMetamodel(metamodel);
                    // Metamodel content
                    let items = item.datatypes;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.deleted) { 
                                const dtype = new cxDatatype(item.id, item.name, item.description);
                                metamodel.addDatatype(dtype);
                                this.addDatatype(dtype);
                            }
                        }
                    }
                    items = item.properties;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.deleted) { 
                                const prop = new cxProperty(item.id, item.name, item.description);
                                if (!prop) continue;
                                this.addProperty(prop);
                            }
                        }
                    }
                    items = item.objecttypes;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.deleted) { 
                                const otype = new cxObjectType(item.id, item.name, item.description);
                                if (!otype) continue;
                                metamodel.addObjectType(otype);
                                this.addObjectType(otype);
                            }
                        }
                    }
                    items = item.objtypegeos;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.deleted) { 
                                const otype = new cxObjtypeGeo(item.id, null, null, "", "");
                                if (!otype) continue;
                                metamodel.addObjtypeGeo(otype);
                                this.addObjtypeGeo(otype);
                            }
                        }
                    }
                    items = item.objecttypeviews;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.deleted) { 
                                const otv = new cxObjectTypeView(item.id, item.name, null, item.description);
                                if (!otv) continue;
                                metamodel.addObjectTypeView(otv);
                                this.addObjectTypeView(otv);
                            }
                        }
                    }
                    items = item.relshiptypes;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.deleted) { 
                                const rtype = new cxRelationshipType(item.id, item.name, null, null, item.description);
                                if (!rtype) continue;
                                metamodel.addRelationshipType(rtype);
                                this.addRelationshipType(rtype);
                            }
                        }
                    }
                    items = item.relshiptypeviews;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.deleted) { 
                                const rtv = new cxRelationshipTypeView(item.id, item.name, null, item.description);
                                if (!rtv) continue;
                                metamodel.addRelationshipTypeView(rtv);
                                this.addRelationshipTypeView(rtv);
                            }
                        }
                    }
                }
            }
        }
        // Import models
        const models = importedData?.models;
        if (models && models.length) {
            for (let i = 0; i < models.length; i++) {
                const item = models[i];
                const model = new cxModel(item.id, item.name, null, item.description);
                this.addModel(model);
                let items = importedData.models;
                if (items && items.length) {
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        if (includeDeleted || !item.deleted) { 
                            const model = new cxModel(item.id, item.name, null, item.description);
                            if (!model) continue;
                            this.addModel(model);
                            
                            // Objects and relationships
                            let objs = item.objects;
                            if (objs && objs.length) {
                                for (let i = 0; i < objs.length; i++) {
                                    const item = objs[i];
                                    if (includeDeleted || !item.deleted) { 
                                        const obj = new cxObject(item.id, item.name, null, item.description);
                                        for (let k in item) {
                                            obj[k] = item[k];
                                        }
                                        if (!obj) continue;
                                        model.addObject(obj);
                                        this.addObject(obj);
                                    }
                                }
                            }
                            let rels = item.relships;
                            if (rels && rels.length) {
                                for (let i = 0; i < rels.length; i++) {
                                    const item = rels[i];
                                    if (includeDeleted || !item.deleted) { 
                                        const rel = new cxRelationship(item.id, null, null, null, item.name, item.description);
                                        if (!rel) continue;
                                        model.addRelationship(rel);
                                        this.addRelationship(rel);
                                    }
                                }
                            }
                            // Model views
                            let mvs = item.modelviews;
                            if (mvs && mvs.length) {
                                for (let i = 0; i < mvs.length; i++) {
                                    const item = mvs[i];
                                    if (includeDeleted || !item.deleted) { 
                                        if (debug) console.log('237 initImport', item);
                                        const mv = new cxModelView(item.id, item.name, null, item.description);
                                        if (!mv) continue;
                                        model.addModelView(mv);
                                        this.addModelView(mv);
                                        mv.setModel(model);
                                        // Object views and relationship views
                                        let views = item.objectviews;
                                        if (views && views.length) {
                                            for (let i = 0; i < views.length; i++) {
                                                const item = views[i];
                                                if (includeDeleted || !item.deleted) { 
                                                    const objview = new cxObjectView(item.id, item.name, null, item.description);
                                                    if (!objview) continue;
                                                    mv.addObjectView(objview);
                                                    this.addObjectView(objview);
                                                }
                                            }
                                        }
                                        views = item.relshipviews;
                                        if (views && views.length) {
                                            for (let i = 0; i < views.length; i++) {
                                                const item = views[i];
                                                if (includeDeleted || !item.deleted) { 
                                                    const rel = new cxRelationshipView(item.id, item.name, null, item.description);
                                                    if (!rel) continue;
                                                    mv.addRelationshipView(rel);
                                                    this.addRelationshipView(rel);
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
    importMetamodel(item: any) {
        const metamodel = this.findMetamodel(item.id);
        if (!metamodel) 
            return;
        let objecttypes: any[] = item.objecttypes;
        if (objecttypes && objecttypes.length) {
            objecttypes.forEach(objtype => {
                if (objtype && !objtype.deleted)
                     this.importObjectType(objtype, metamodel);
            });
        }

        let objtypegeos: any[] = item.objtypegeos;
        if (objtypegeos && objtypegeos.length) {
            objtypegeos.forEach(objtypegeo => {
                if (objtypegeo && !objtypegeo.deleted) 
                    this.importObjectTypegeo(objtypegeo, metamodel);
            });
        }

        let objecttypeviews: any[] = item.objecttypeviews;
        if (objecttypeviews && objecttypeviews.length) {
            objecttypeviews.forEach(objtypeview => {
                if (objtypeview && !objtypeview.deleted) 
                    this.importObjectTypeView(objtypeview, metamodel);
            });
        }

        objecttypes = item.objecttypes;
        if (objecttypes && objecttypes.length) {
            objecttypes.forEach(objtype => {
                if (objtype && !objtype.deleted) {
                    this.importObjectType(objtype, metamodel);
                }
            });
        }
        objtypegeos = item.objtypegeos;
        if (objtypegeos && objtypegeos.length) {
            objtypegeos.forEach(objtypegeo => {
                if (objtypegeo && !objtypegeo.deleted)
                    this.importObjectTypegeo(objtypegeo, metamodel);
            });
        }
        objecttypeviews = item.objecttypeviews;
        if (objecttypeviews && objecttypeviews.length) {
            objecttypeviews.forEach(objtypeview => {
                if (objtypeview && !objtypeview.deleted)
                    this.importObjectTypeView(objtypeview, metamodel);
            });
        }

        let relshiptypes: any[] = item.relshiptypes;
        if (relshiptypes && relshiptypes.length) {
            relshiptypes.forEach(reltype => {
                if (reltype && !reltype.deleted) 
                    this.importRelshipType(reltype, metamodel);
            });
        }
        let relshiptypeviews: any[] = item.relshiptypeviews;
        if (relshiptypeviews && relshiptypeviews.length) {
            relshiptypeviews.forEach(reltypeview => {
                if (reltypeview && !reltypeview.deleted)
                    this.importRelshipTypeView(reltypeview, metamodel);
            });
        }
        relshiptypes = item.relshiptypes;
        if (relshiptypes && relshiptypes.length) {
            relshiptypes.forEach(reltype => {
                if (reltype && !reltype.setDeleted)
                    this.importRelshipType(reltype, metamodel);
            });
        }
        relshiptypeviews = item.relshiptypeviews;
        if (relshiptypeviews && relshiptypeviews.length) {
            relshiptypeviews.forEach(reltypeview => {
                if (reltypeview && !reltypeview.deleted)
                    this.importRelshipTypeView(reltypeview, metamodel);
            });
        }
    }
    importObjectType(item: any, metamodel: cxMetaModel) {
        let objtype = this.findObjectType(item.id);
        if (!objtype) {
            objtype = new cxObjectType(item.id, item.name, item.description);
        }
        if (objtype) {
            if (debug) console.log('405 Object type', objtype);
            objtype.deleted = item.deleted;
            let otype = (objtype as any);
            for (const prop in item) {
                if (item[prop]) {
                    otype[prop] = item[prop];
                }
            }
            if (item.typeviewRef) {
                const objtypeview = this.findObjectTypeView(item.typeviewRef);
                if (objtype && objtypeview)
                    objtype.setDefaultTypeView(objtypeview);
            }
            if (objtype) metamodel.addObjectType(objtype);

            const properties: any[] = item.properties;
            if (properties && properties.length) {
                properties.forEach(p => {
                    const prop = p as cxProperty;
                    if (prop) this.importProperty(prop, metamodel);
                })
            }
        }
    }
    importRelshipType(item: any, metamodel: cxMetaModel) {
        let reltype = this.findRelationshipType(item.id);
        let fromobjtype = metamodel.findObjectType(item.fromobjtypeRef);
        let toobjtype = metamodel.findObjectType(item.toobjtypeRef);
        if (!reltype) {
            if (fromobjtype && toobjtype)
                reltype = new cxRelationshipType(item.id, item.name, fromobjtype, toobjtype, item.description);
        }
        if (reltype) {
            reltype.deleted = item.deleted;
            let rtype = (reltype as any);
            for (const prop in rtype) {
                if (utils.objExists(item[prop]))
                    rtype[prop] = item[prop];
            }
            if (item.fromobjtypeRef && item.toobjtypeRef) {
                const fromobjType = this.findObjectType(item.fromobjtypeRef);
                const toobjType = this.findObjectType(item.toobjtypeRef);

                if (reltype && fromobjType) reltype.setFromObjtype(fromobjType);
                if (reltype && toobjType) reltype.setToObjtype(toobjType);
                if (item.typeviewRef) {
                    const reltypeview = this.findRelationshipTypeView(item.typeviewRef);
                    if (reltype && reltypeview)
                        reltype.setDefaultTypeView(reltypeview);
                }
                if (debug) console.log("Importing relshiptype: " + item.id + ", " + item.name);
                const properties: any[] = item.properties;
                if (properties && properties.length) {
                    properties.forEach(p => {
                        const prop = p as cxProperty;
                        if (prop) this.importProperty(prop, metamodel);
                    });
                }
            }
        }
    }
    importObjectTypeView(item: any, metamodel: cxMetaModel) {
        const objtypeview = this.findObjectTypeView(item.id);
        const typeref = item.typeRef;
        const type = this.findObjectType(typeref);
        if (objtypeview && type) {
            objtypeview.setDeleted(item.deleted);
            objtypeview.setStrokewidth(item.strokewidth);
            objtypeview.setType(type);
            objtypeview.setFigure(item.figure);
            objtypeview.setFillcolor(item.fillcolor);
            objtypeview.setStrokecolor(item.strokecolor);
            objtypeview.setStrokewidth(item.strokewidth);
            objtypeview.setIcon(item.icon);
            objtypeview.setGroup(item.group);
            objtypeview.setIsGroup(item.isGroup);
            if (debug) console.log('222 objtypeview', objtypeview, item);
            metamodel.addObjectTypeView(objtypeview);
            if (debug) console.log("Importing objtypeview: " + item.id + ", " + item.name);
        }
    }
    importObjectTypegeo(item: any, metamodel: cxMetaModel) {
        let typeref = item.typeRef;
        let type = this.findObjectType(typeref);
        if (type) {
            let objtypegeo = this.findObjtypeGeo(item.id);
            if (objtypegeo) {
                objtypegeo.setType(type);
                objtypegeo.setMetamodel(metamodel);
                objtypegeo.setLoc(item.loc);
                objtypegeo.setSize(item.size);
                metamodel.addObjtypeGeo(objtypegeo);
            }
        }
    }
    importRelshipTypeView(item: any, metamodel: cxMetaModel) {
        const reltypeview = this.findRelationshipTypeView(item.id);
        const typeref = item.typeRef;
        const type = this.findRelationshipType(typeref);
        if (reltypeview && type) {
            reltypeview.setDeleted(item.deleted);
            reltypeview.setType(type);
            reltypeview.setStrokecolor(item.strokecolor);
            reltypeview.setStrokewidth(item.strokewidth);
            reltypeview.setDash(item.dash);
            reltypeview.setFromArrow(item.fromarrow);
            reltypeview.setToArrow(item.toarrow);
            metamodel.addRelationshipTypeView(reltypeview);
            if (debug) console.log("Importing reltypeview: " + item.id + ", " + item.name);
        }
    }
    importProperty(item: any, metamodel: cxMetaModel) {
        let property = this.findProperty(item.id);
        if (property) {
            for (const prop in item) {
                if (item[prop]) {
                    let p = (property as any)
                    p[prop] = item[prop];
                }
            }
            metamodel.addProperty(property);
            metamodel.addProperty(property);
        }
    }
    importModel(item: any) {
        const model = this.findModel(item.id);
        if (model) {
            const metamodel = this.findMetamodel(item.metamodelRef);
            if (metamodel) {
                model.setMetamodel(metamodel);
                const objects: any[] = item.objects;
                if (objects && objects.length) {
                    objects.forEach(object => {
                        if (model) this.importObject(object, model);
                    });
                }
                const relships: any[] = item.relships;
                if (relships && (relships.length > 0)) {
                    relships.forEach(rel => {
                        if (model) this.importRelship(rel, model);
                    });
                }
                const modelviews: any[] = item.modelviews;
                if (modelviews && (modelviews.length > 0)) {
                    modelviews.forEach(mv => {
                        if (model) this.importModelView(mv, model);
                    });
                }
                model.targetMetamodelRef = item.targetMetamodelRef;
                model.sourceModelRef = item.sourceModelRef;
                model.targetModelRef = item.targetModelRef;
                model.pasteViewsOnly = item.pasteViewsOnly;
                model.deleteViewsOnly = item.deleteViewsOnly;
            }
        }
        
    }
    importObject(item: any, model: cxModel | null) {
        const obj = this.findObject(item.id);
        if (obj) {
            const objtype = this.findObjectType(item.typeRef);
            if (objtype) {
                obj.setType(objtype);
                obj.deleted = item.deleted;
                if (model) model.addObject(obj);
            } else {
                obj.typeName = item.typeName;
                obj.typeRef  = item.typeRef;
            }

        }
    }
    importRelship(item: any, model: cxModel | null) {
        if (model) {
            const rel = this.findRelationship(item.id);
            if (rel && item.typeRef) {
                const reltype = this.findRelationshipType(item.typeRef);
                const fromObj = this.findObject(item.fromobjectRef);
                const toObj = this.findObject(item.toobjectRef);
                if (reltype && fromObj && toObj) {
                    rel.setType(reltype);
                    rel.setFromObject(fromObj);
                    rel.setToObject(toObj);
                    fromObj.addOutputrel(rel);
                    toObj.addInputrel(rel);
                    rel.deleted = item.deleted;
                    model.addRelationship(rel);
                }
            } else {
                rel.typeName = item.typeName;
                rel.typeRef  = item.typeRef;
            } 
        }
    }
    importModelView(item: any, model: cxModel) {
        if (model) {
            const modelview = this.findModelView(item.id);
            if (modelview) {
                model.addModelView(modelview);
                const objectviews: any[] = item.objectviews;
                objectviews.forEach(objview => {
                    if (objview) {
                        this.importObjectView(objview, modelview);
                    }
                });
                const relshipviews: any[] = item.relshipviews;
                relshipviews.forEach(relview => {
                    if (relview)
                        this.importRelshipView(relview, modelview);
                });
            }
        }
    }
    importObjectView(item: any, modelview: cxModelView) {
        if (modelview) {
            const objview = this.findObjectView(item.id);
            if (objview) {
                const object = this.findObject(item.objectRef);
                if (object) {
                    objview.setObject(object);
                    objview.setLoc(item.loc);
                    objview.setSize(item.size);
                    objview.setGroup(item.group);
                    objview.setIsGroup(item.isGroup);
                    objview.deleted = item.deleted;
                    if (item.typeviewRef) {
                        const objtypeview = this.findObjectTypeView(item.typeviewRef);
                        if (objtypeview)
                            objview.setTypeView(objtypeview);
                    }
                    object.addObjectView(objview);
                    modelview.addObjectView(objview);
                }
            }
        }
    }
    importRelshipView(item: any, modelview: cxModelView) {
        if (modelview) {
            const relview = this.findRelationshipView(item.id);
            if (relview) {
                const relship = this.findRelationship(item.relshipRef);
                if (relship) {
                    relview.setRelationship(relship);
                    const fromobjview = modelview.findObjectView(item.fromobjviewRef) as cxObjectView;
                    const toobjview = modelview.findObjectView(item.toobjviewRef) as cxObjectView;
                    relview.setFromObjectView(fromobjview);
                    relview.setToObjectView(toobjview);
                    relview.deleted = item.deleted;
                    // relview.setData(item.data);
                    if (item.typeviewRef) {
                        const reltypeview = this.findRelationshipTypeView(item.typeviewRef);
                        if (reltypeview)
                            relview.setTypeView(reltypeview);
                    }
                    relship.addRelationshipView(relview);
                    modelview.addRelationshipView(relview);
                    if (debug) console.log("Importing object: " + item.id + ", " + item.name);
                }
            }
        }
    }
    addItem(item: any) {
        switch (item.class) {
            case 'cxRepository':
                this.addRepository(item);
                break;
            case 'cxMetaModel':
                this.addMetamodel(item);
                break;
            case 'cxDatatype':
                this.addDatatype(item);
                break;
            case 'cxObjectType':
                this.addObjectType(item);
                break;
            case 'cxRelationshipType':
                this.addRelationshipType(item);
                break;
            case 'cxProperty':
                this.addProperty(item);
                break;
            case 'cxObjectTypeView':
                this.addObjectTypeView(item);
                break;
            case 'cxRelationshipTypeView':
                this.addRelationshipTypeView(item);
                break;
            case 'cxModel':
                this.addModel(item);
                break;
            case 'cxObject':
            case 'cxbject':
            case 'cxEkaRelationship':
                this.addObject(item);
                break;
            case 'cxRelationship':
                this.addRelationship(item);
                break;
            case 'cxModelView':
                this.addModelView(item);
                break;
            case 'cxObjectView':
                this.addObjectView(item);
                break;
            case 'cxRelationshipView':
                this.addRelationshipView(item);
                break;
        }
    }
    addRepository(rep: cxRepository) {
        if (rep.class === "cxRepository") {
            if (this.repositories == null)
                this.repositories = new Array();
            if (!this.findRepository(rep.id))
                this.repositories.push(rep);
        }
    }
    addMetamodel(metamodel: cxMetaModel) {
        if (metamodel.class === "cxMetaModel") {
            if (this.metamodels == null)
                this.metamodels = new Array();
            if (!this.findMetamodel(metamodel.id))
                this.metamodels.push(metamodel);
        }
    }
    addModel(model: cxModel) {
        if (model.class === "cxModel") {
            //model.setMetis(this);
            if (this.models == null)
                this.models = new Array();
            if (!this.findModel(model.id))
                this.models.push(model);
        }
    }
    addModelView(modelview: cxModelView) {
        if (modelview.class === "cxModelView") {
            //modelview.setMetis(this);
            if (this.modelviews == null)
                this.modelviews = new Array();
            if (!this.findModelView(modelview.id))
                this.modelviews.push(modelview);
        }
    }
    addDatatype(dtype: cxDatatype) {
        if (dtype.class === "cxDatatype") {
            //dtype.setMetis(this);
            if (this.datatypes == null)
                this.datatypes = new Array();
            if (!this.findDatatype(dtype.id))
                this.datatypes.push(dtype);
        }
    }
    addViewFormat(fmt: cxViewFormat) {
        if (fmt.class === "cxViewFormat") {
            //dtype.setMetis(this);
            if (this.viewformats == null)
                this.viewformats = new Array();
            if (!this.findViewFormat(fmt.id))
                this.viewformats.push(fmt);
        }
    }
    addInputPattern(pattern: cxInputPattern) {
        if (pattern.class === "cxInputPattern") {
            //dtype.setMetis(this);
            if (this.inputpatterns == null)
                this.inputpatterns = new Array();
            if (!this.findInputPattern(pattern.id))
                this.inputpatterns.push(pattern);
        }
    }
    addEnumeration(enumval: cxEnumeration) {
        if (enumval.class === "cxEnumeration") {
            //enumval.setMetis(this);
            if (this.enumerations == null)
                this.enumerations = new Array();
            this.enumerations.push(enumval);
        }
    }
    addUnit(unit: cxUnit) {
        if (unit.class === "cxUnit") {
            //unit.setMetis(this);
            if (this.units == null)
                this.units = new Array();
            this.units.push(unit);
        }
    }
    addUnitCategory(cat: cxUnitCategory) {
        if (cat.class === "cxUnitCategory") {
            if (this.categories == null)
                this.categories = new Array();
            this.categories.push(cat);
        }
    }
    addProperty(prop: cxProperty) {
        if (prop.class === "cxProperty") {
            //prop.setMetis(this);
            if (this.properties == null)
                this.properties = new Array();
            if (!this.findProperty(prop.id))
                this.properties.push(prop);
        }
    }
    addObjectType(objtype: cxObjectType) {
        if (objtype.class === "cxObjectType") {
            //objtype.setMetis(this);
            if (this.objecttypes == null)
                this.objecttypes = new Array();
            if (!this.findObjectType(objtype.id))
                this.objecttypes.push(objtype);
        }
    }
    addRelationshipType(reltype: cxRelationshipType) {
        if (reltype.class === "cxRelationshipType") {
            //reltype.setMetis(this);
            if (this.relshiptypes == null)
                this.relshiptypes = new Array();
            if (!this.findRelationshipType(reltype.id))
                this.relshiptypes.push(reltype);
        }
    }
    addObjectTypeView(objtypeview: cxObjectTypeView) {
        if (objtypeview.class === "cxObjectTypeView") {
            //objtypeview.setMetis(this);
            if (this.objecttypeviews == null)
                this.objecttypeviews = new Array();
            if (!this.findObjectTypeView(objtypeview.id))
                this.objecttypeviews.push(objtypeview);
        }
    }
    addRelationshipTypeView(reltypeview: cxRelationshipTypeView) {
        if (reltypeview.class === "cxRelationshipTypeView") {
            //reltypeview.setMetis(this);
            if (this.relshiptypeviews == null)
                this.relshiptypeviews = new Array();
            if (!this.findRelationshipTypeView(reltypeview.id))
                this.relshiptypeviews.push(reltypeview);
        }
    }
    addObjtypeGeo(objtypegeo: cxObjtypeGeo) {
        if (objtypegeo.class === "cxObjtypeGeo") {
            //objtypegeo.setMetis(this);
            if (this.objtypegeos == null)
                this.objtypegeos = new Array();
            if (!this.findObjtypeGeo(objtypegeo.id))
                this.objtypegeos.push(objtypegeo);
        }
    }
    addObject(obj: cxObject) {
        if (obj.class === "cxObject") {
            //obj.setMetis(this);
            if (this.objects == null)
                this.objects = new Array();
            if (!this.findObject(obj.id)) {
                if (debug) console.log('863 addObject:', obj);
                this.objects.push(obj);
            }
        }
    }
    addRelationship(rel: cxRelationship) {
        if (rel.class === "cxRelationship") {
            //rel.setMetis(this);
            if (this.relships == null)
                this.relships = new Array();
            if (!this.findRelationship(rel.id))
                this.relships.push(rel);
        }
    }
    addObjectView(objview: cxObjectView) {
        if (objview.class === "cxObjectView") {
            //objview.setMetis(this);
            if (this.objectviews == null)
                this.objectviews = new Array();
            if (!this.findObjectView(objview.id))
                this.objectviews.push(objview);
        }
    }
    addRelationshipView(relview: cxRelationshipView) {
        if (relview.class === "cxRelationshipView") {
            //relview.setMetis(this);
            if (this.relshipviews == null)
                this.relshipviews = new Array();
            if (!this.findRelationshipView(relview.id))
                this.relshipviews.push(relview);
        }
    }
    setGojsModel(model: gjs.goModel) {
        this.gojsModel = model;
    }
    getGojsModel() {
        return this.gojsModel;
    }
    getMetamodels() {
        return this.metamodels;
    }
    getModels() {
        return this.models;
    }
    getModels2(includeDeleted: boolean) {
        if (includeDeleted)
            return this.models;
        if (!this.models)
            return this.models;
        else {
            let models = new Array();
            for (let i = 0; i < this.models.length; i++) {
                let model = this.models[i];
                if (model.isDeleted())
                    continue;
                models.push(model);
            }
            return models;
        }
    }
    getTemplateModels() {
        const models = [];
        const mdls = this.models;
        if (mdls) {
            const l = mdls.length;
            for (let i = 0; i < l; i++) {
                const mdl = mdls[i]
                if (utils.objExists(mdl)) {
                    if (mdl.getIsTemplate()) {
                        models.push(mdl);
                    }
                }
            }
        }
        return models;
    }
    getModelViews() {
        return this.modelviews;
    }
    getModelViewsByModel(model: cxModel) {
        const modelviews = [];
        if (model) {
            const mviews = this.modelviews;
            if (mviews) {
                const l = mviews.length;
                for (let i = 0; i < l; i++) {
                    const mview = mviews[i]
                    if (mview) {
                        const m = mview.getModel();
                        if (m) {
                            if (model.getName() === m.getName()) {
                                modelviews.push(mview);
                            }
                        }
                    }
                }
            }
        }
        return modelviews;
    }
    getTemplateModelviewByName(name: string) {
        if (name && (name.length > 0)) {
            const mviews = this.modelviews;
            if (mviews) {
                const l = mviews.length;
                for (let i = 0; i < l; i++) {
                    const mview = mviews[i]
                    if (mview) {
                        if (mview.getName() === name) {
                            if (mview.getIsTemplate())
                                return mview;
                        }
                    }
                }
            }
        }
        return null;
    }
    getTemplateModelviews() {
        const modelviews = [];
        const mviews = this.modelviews;
        if (mviews) {
            const l = mviews.length;
            for (let i = 0; i < l; i++) {
                const mview = mviews[i]
                if (mview) {
                    if (mview.getIsTemplate()) {
                        modelviews.push(mview);
                    }
                }
            }
        }
        return modelviews;
    }
    getDatatypes() {
        return this.datatypes;
    }
    getViewFormats() {
        return this.viewformats;
    }
    getInputPatterns() {
        return this.inputpatterns;
    }
    getEnumerations() {
        return this.enumerations;
    }
    getUnits() {
        return this.units;
    }
    getUnitCategories() {
        return this.categories;
    }
    getProperties() {
        return this.properties;
    }
    getObjectTypes() {
        return this.objecttypes;
    }
    getRelationshipTypes() {
        return this.relshiptypes;
    }
    getObjectTypeViews() {
        return this.objecttypeviews;
    }
    getObjtypeGeos() {
        return this.objtypegeos;
    }
    getRelationshipTypeViews() {
        return this.relshiptypeviews;
    }
    getObjects() {
        return this.objects;
    }
    getObjectsByType(objtype: cxObjectType, includeSubTypes: boolean) {
        let objects = new Array();
        if (this.objects) {
            for (let i = 0; i < this.objects.length; i++) {
                let obj = this.objects[i];
                if (obj && !obj.deleted) {
                    let type = obj.type;
                    if (type && type.id === objtype.id) 
                        objects.push(obj);
                }
            }
            if (includeSubTypes) {
                // get list of subtypes
            }
        }
        return objects;
    }
    getRelationships() {
        return this.relships;
    }
    getRelationshipsByType(reltype: cxRelationshipType, includeSubTypes: boolean) {
        let relships = new Array();
        if (this.relships) {
            for (let i = 0; i < this.relships.length; i++) {
                let rel = this.relships[i];
                if (rel && !rel.deleted) {
                    let type = rel.type;
                    if (type && type.id === reltype.id) 
                    relships.push(rel);
                }
            }
            if (includeSubTypes) {
                // get list of subtypes
            }
        }
        return relships;
    }
    getObjectViews() {
        return this.objectviews;
    }
    getObjectViewsByObject(objid: string) {
        const objectviews = this.objectviews;
        const objviews = new Array();
        for (let i = 0; i < objectviews.length; i++) {
            const objview = objectviews[i];
            if (objview) {
                const obj = objview.object;
                if (obj) {
                    if (obj.id === objid)
                        objviews.push(objview);
                }
            }
        }
        return objviews;
    }
    getRelationshipViews() {
        return this.relshipviews;
    }
    getRelationshipViewsByRelship(relid: string) {
        const relshipviews = this.relshipviews;
        const relviews = new Array();
        for (let i = 0; i < relshipviews.length; i++) {
            const relview = relshipviews[i];
            if (relview) {
                const rel = relview.relship;
                if (rel.id === relid)
                    relviews.push(relview);
            }
        }
        return relviews;
    }
    findItem(coll: string, id: string) {
        let retval = null;
        switch (coll) {
            case 'metamodels':
                retval = this.findMetamodel(id);
                break;
            case 'datatypes':
                retval = this.findDatatype(id);
                break;
            case 'objecttypes':
                retval = this.findObjectType(id);
                break;
            case 'relationshiptypes':
                retval = this.findRelationshipType(id);
                break;
            case 'properties':
                retval = this.findProperty(id);
                break;
            case 'objecttypeviews':
                retval = this.findObjectTypeView(id);
                break;
            case 'relationshiptypeviews':
                retval = this.findRelationshipTypeView(id);
                break;
            case 'models':
                retval = this.findModel(id);
                break;
            case 'objects':
                retval = this.findObject(id);
                break;
            case 'relationships':
                retval = this.findRelationship(id);
                break;
            case 'objectviews':
                retval = this.findObjectView(id);
                break;
            case 'relationshipviews':
                retval = this.findRelationshipView(id);
                break;
        }
        return retval;
    }
    findRepository(id: string) {
        let repositories = this.getRepositories();
        if (!repositories)
            return null;
        else {
            let i = 0;
            while (i < repositories.length) {
                let repository = repositories[i];
                if (repository && repository.id === id)
                    return repository;
                i++;
            }
        }
        return null;
    }
    findDatatype(id: string) {
        let datatypes = this.getDatatypes();
        if (!datatypes)
            return null;
        else {
            let i = 0;
            while (i < datatypes.length) {
                let datatype = datatypes[i];
                if (datatype && datatype.id === id)
                    return datatype;
                i++;
            }
        }
        return null;
    }
    findViewFormat(id: string) {
        let formats = this.getViewFormats();
        if (!formats)
            return null;
        else {
            let i = 0;
            while (i < formats.length) {
                let format = formats[i];
                if (format && format.id === id)
                    return format;
                i++;
            }
        }
        return null;
    }
    findInputPattern(id: string) {
        let patterns = this.getInputPatterns();
        if (!patterns)
            return null;
        else {
            let i = 0;
            while (i < patterns.length) {
                let pattern = patterns[i];
                if (pattern && pattern.id === id)
                    return pattern;
                i++;
            }
        }
        return null;
    }
    findDatatypeByName(name: string) {
        const types = this.getDatatypes();
        if (!types) {
            return null;
        } else {
            let i = 0;
            let dtype = null;
            while (i < types.length) {
                dtype = types[i];
                let dtname = dtype.getName();
                if (dtname.toLowerCase() === name.toLowerCase())
                    return dtype;
                i++;
            }
        }
        return null;
    }
    findEnumeration(id: string) {
        const enums = this.getEnumerations();
        if (!enums)
            return null;
        else {
            let i = 0;
            let Enum = null;
            while (i < enums.length) {
                Enum = enums[i];
                if (Enum.id === id)
                    return Enum;
                i++;
            }
        }
        return null;
    }
    findMetamodel(id: string) {
        const metamodels = this.getMetamodels();
        if (!metamodels) {
            return null;
        } else {
            let i = 0;
            let metamodel = null;
            while (i < metamodels.length) {
                metamodel = metamodels[i];
                if (metamodel) {
                    if (metamodel.id === id)
                        return metamodel;
                    else if (metamodel.getFirestoreId() === id)
                        return metamodel;
                }
                i++;
            }
        }
        return null;
    }
    findMetamodelByName(name: string) {
        const metamodels = this.getMetamodels();
        if (!metamodels) {
            return null;
        } else {
            let i = 0;
            let metamodel = null;
            while (i < metamodels.length) {
                metamodel = metamodels[i];
                if (metamodel.getName() === name)
                    return metamodel;
                i++;
            }
        }
        return null;
    }
    findModel(id: string) {
        const models = this.getModels();
        if (!models) {
            return null;
        } else {
            let i = 0;
            let model = null;
            while (i < models.length) {
                model = models[i];
                if (model) {
                    if (model.id === id)
                        return model;
                    else if (model.getFirestoreId() === id)
                        return model;
                }
                i++;
            }
        }
        return null;
    }
    findModelView(id: string) {
        const modelviews = this.getModelViews();
        if (!modelviews) {
            return null;
        } else {
            let i = 0;
            let mv = null;
            while (i < modelviews.length) {
                mv = modelviews[i];
                if (mv) {
                    if (mv.id === id)
                        return mv;
                    else if (mv.getFirestoreId() === id)
                        return mv;
                }
                i++;
            }
        }
        return null;
    }
    findModelByName(name: string) {
        const models = this.getModels();
        if (!models) {
            return null;
        } else {
            let i = 0;
            let model = null;
            while (i < models.length) {
                model = models[i];
                if (model.getName() === name)
                    return model;
                i++;
            }
        }
        return null;
    }
    findObjectType(id: string) {
        const types = this.getObjectTypes();
        if (!types) {
            return null;
        } else {
            let i = 0;
            let objtype = null;
            while (i < types.length) {
                objtype = types[i];
                if (objtype) {
                    if (objtype.id === id)
                        return objtype;
                    else if (objtype.getFirestoreId() === id)
                        return objtype;
                }
                i++;
            }
        }
        return null;
    }
    findObjectTypeByName(name: string) {
        const types = this.getObjectTypes();
        if (!types) {
            return null;
        } else {
            let i = 0;
            let objtype = null;
            while (i < types.length) {
                objtype = types[i];
                if (objtype.getName() === name)
                    return objtype;
                i++;
            }
        }
        return null;
    }
    findObjectTypeView(id: string) {
        const typeviews = this.getObjectTypeViews();
        if (!typeviews) {
            return null;
        } else {
            let i = 0;
            let objecttypeview = null;
            while (i < typeviews.length) {
                objecttypeview = typeviews[i];
                if (objecttypeview) {
                    if (objecttypeview.id === id)
                        return objecttypeview;
                    else if (objecttypeview.getFirestoreId() === id)
                        return objecttypeview;
                }
                i++;
            }
        }
        return null;
    }
    findObjtypeGeo(id: string) {
        let objtypegeos = this.getObjtypeGeos();
        if (!objtypegeos) {
            return null;
        } else {
            let i = 0;
            let objtypegeo = null;
            while (i < objtypegeos.length) {
                objtypegeo = objtypegeos[i];
                if (objtypegeo) {
                    if (objtypegeo.id === id)
                        return objtypegeo;
                    else if (objtypegeo.getFirestoreId() === id)
                        return objtypegeo;
                }
                i++;
            }
        }
        return null;
    }
    findObject(id: string) {
        const objects = this.getObjects();
        if (!objects) {
            return null;
        } else {
            let i = 0;
            let obj = null;
            while (i < objects.length) {
                obj = objects[i];
                if (obj) {
                    if (obj.id === id)
                        return obj;
                    else if (obj.getFirestoreId() === id)
                        return obj;
                }
                i++;
            }
        }
        return null;
    }
    findObjectByTypeAndName(type: cxObjectType, name: string) {
        const objects = this.getObjects();
        if (!objects) {
            return null;
        } else if (utils.objExists(type)) {
            const typeid = type.id;
            let i = 0;
            let obj = null;
            while (i < objects.length) {
                obj = objects[i];
                if (debug) console.log(obj);
                if (obj) {
                    let type = obj.getType();
                    if (type) {
                        if (type.id === typeid) {
                            if (obj.getName() === name)
                                return obj;
                        }
                    }
                }
                i++;
            }
        }
        return null;
    }
    findObjectView(id: string) {
        const objectviews = this.getObjectViews();
        if (!objectviews) {
            return null;
        } else {
            let i = 0;
            let objview = null;
            while (i < objectviews.length) {
                objview = objectviews[i];
                if (objview) {
                    if (objview.id === id)
                        return objview;
                    else if (objview.getFirestoreId() === id)
                        return objview;
                }
                i++;
            }
        }
        return null;
    }
    findProperty(id: string) {
        let properties = this.getProperties();
        if (!properties)
            return null;
        else {
            let i = 0;
            let prop = null;
            while (i < properties.length) {
                prop = properties[i];
                if (prop) {
                    if (prop.id === id)
                        return prop;
                    else if (prop.getFirestoreId() === id)
                        return prop;
                }
                i++;
            }
        }
        return null;
    }
    findPropertyByName(propname: string) {
        let properties = this.getProperties();
        if (!properties)
            return null;
        else {
            let i = 0;
            let prop = null;
            while (i < properties.length) {
                prop = properties[i];
                if (prop.name === propname)
                    return prop;
                i++;
            }
        }
        return null;
    }
    findRelationshipType(id: string) {
        const types = this.relshiptypes;
        if (!types) {
            return null;
        } else {
            let i = 0;
            let reltype = null;
            while (i < types.length) {
                reltype = types[i];
                if (reltype) {
                    if (reltype.id === id)
                        return reltype;
                    if (reltype.getFirestoreId() === id)
                        return reltype;
                }
                i++;
            }
        }
        return null;
    }
    findRelationshipTypeByName(name: string) {
        const types = this.getRelationshipTypes();
        if (!types) {
            return null;
        } else {
            let i = 0;
            let reltype = null;
            while (i < types.length) {
                reltype = types[i];
                if (reltype.isDeleted()) continue;
                if (reltype.getName() === name)
                    return reltype;
                i++;
            }
        }
        return null;
    }
    findRelationshipTypeByName2(name: string, fromObjType: cxObjectType, toObjType: cxObjectType) {
        const types = this.getRelationshipTypes();
        if (!types) {
            return null;
        } else {
            let i = 0;
            let reltype: cxRelationshipType | null = null;
            while (i < types.length) {
                reltype = types[i];
                if (reltype.isDeleted()) continue;
                if (reltype.getName() === name) {
                    if (debug) console.log('1502 reltype', reltype, fromObjType, toObjType);
                    if (reltype.isAllowedFromType(fromObjType, this.objecttypes, this.relshiptypes)) {
                        if (debug) console.log('1504 reltype', reltype.name, fromObjType.name);
                        if (reltype.isAllowedToType(toObjType, this.objecttypes, this.relshiptypes)) {
                            if (debug) console.log('1506 reltype', reltype.name, toObjType.name);
                            return reltype; 
                        }
                    }
                }
                i++;
            }
        }
        return null;
    }
    findRelationshipTypesBetweenTypes(fromType: cxObjectType, toType: cxObjectType) {
        if (!fromType || !toType)
            return null;
        let reltypes = new Array();
        let types = this.getRelationshipTypes();
        if (utils.isArrayEmpty(types)) {
            return null;
        } else if (types) {
            let i = 0;
            let reltype;
            for (i = 0; i < types.length; i++) {
                reltype = types[i];
                const rtname = reltype.name;
                if (reltype) {
                    if (reltype.isDeleted()) continue;
                    if (debug) console.log('1528 fromType', fromType);
                    if (reltype.getRelshipKind() !== constants.relkinds.GEN) {
                        if (debug) console.log('1530 reltype', reltype.name);
                        if (reltype.isAllowedFromType(fromType, this.objecttypes, this.relshiptypes)) {
                            if (debug) console.log('1518 reltype', reltype.name, fromType.name);
                            if (reltype.isAllowedToType(toType, this.objecttypes, this.relshiptypes)) {
                                if (debug) console.log('1520 reltype', reltype.name, toType.name);
                                reltypes.push(reltype); 
                            }
                        }
                    }
                }
            }
        }
        return reltypes;
    }
    findRelationshipTypeView(id: string) {
        let relshiptypeviews = this.relshiptypeviews;
        if (!relshiptypeviews) {
            return null;
        } else {
            let i = 0;
            while (i < relshiptypeviews.length) {
                let relshiptypeview = relshiptypeviews[i];
                if (relshiptypeview) {
                    if (relshiptypeview.id === id)
                        return relshiptypeview;
                    else if (relshiptypeview.getFirestoreId() === id)
                        return relshiptypeview;
                }
                i++;
            }
        }
        return null;
    }
    findRelationship(id: string) {
        const rels = this.getRelationships();
        if (!rels) {
            return null;
        } else {
            let i = 0;
            let rel = null;
            while (i < rels.length) {
                rel = rels[i];
                if (rel) {
                    if (rel.id === id)
                        return rel;
                    else if (rel.getFirestoreId() === id)
                        return rel;
                }
                i++;
            }
        }
        return null;
    }
    findRelationshipView(id: string) {
        const relviews = this.getRelationshipViews();
        if (!relviews) {
            return null;
        } else {
            let i = 0;
            let relview = null;
            while (i < relviews.length) {
                relview = relviews[i];
                if (relview) {
                    if (relview.id === id)
                        return relview;
                    else if (relview.getFirestoreId() === id)
                        return relview;
                }
                i++;
            }
        }
        return null;
    }
    findSubMetamodel(id: string) {
        let metamodels = this.getMetamodels();
        if (!metamodels) {
            return null;
        } else {
            let i = 0;
            let submeta = null;
            while (i < metamodels.length) {
                submeta = metamodels[i];
                if (submeta.id === id)
                    return submeta;
                i++;
            }
        }
        return null;
    }
    findUnit(id: string) {
        let units = this.getUnits()
        if (!units)
            return null;
        else {
            let i = 0;
            let unit = null;
            while (i < units.length) {
                unit = units[i];
                if (unit.id === id)
                    return unit;
                i++;
            }
        }
        return null;
    }
    findUnitByName(name: string) {
        let units = this.getUnits();
        if (!(units)) {
            return null;
        } else {
            let i = 0;
            let unit = null;
            while (i < units.length) {
                unit = units[i];
                let uname = unit.getName();
                if (uname.toLowerCase() === name.toLowerCase())
                    return unit;
                i++;
            }
        }
        return null;
    }
    findUnitCategory(id: string) {
        if (utils.isArrayEmpty(this.getUnitCategories()))
            return null;
        else {
            let i = 0;
            let category = null;
            let categories = this.getUnitCategories();
            if (categories) {
                while (i < categories.length) {
                    category = categories[i];
                    if (category) {
                        if (category.id === id)
                            return category;
                        else if (category.getFirestoreId() === id)
                            return category;
                    }
                    i++;
                }
            }
        }
        return null;
    }
    findUnitCategoryByName(name: string) {
        let categories = this.getUnitCategories();
        if (!categories) {
            return null;
        } else {
            let i = 0;
            let category = null;
            while (i < categories.length) {
                category = categories[i];
                let cname = category.getName();
                if (cname.toLowerCase() === name.toLowerCase())
                    return category;
                i++;
            }
        }
        return null;
    }
    setCurrentRepository(repository: cxRepository) {
        this.currentRepository = repository;
    }
    getCurrentRepository(): cxRepository {
        return this.currentRepository;
    }
    getRepositories(): cxRepository[] {
        return this.repositories;
    }
    setCurrentModelview(modelview: cxModelView) {
        this.currentModelview = modelview;
    }
    getCurrentModelview(): cxModelView {
        return this.currentModelview;
    }
    setCurrentModel(model: cxModel) {
        this.currentModel = model;
    }
    getCurrentModel(): cxModel {
        return this.currentModel;
    }
    setCurrentTemplateModel(model: cxModel) {
        this.currentTemplateModel = model;
    }
    getCurrentTemplateModel(): cxModel {
        return this.currentTemplateModel;
    }
    setCurrentMetamodel(metamodel: cxMetaModel) {
        this.currentMetamodel = metamodel;
    }
    getCurrentMetamodel(): cxMetaModel {
        return this.currentMetamodel;
    }
    setCurrentTargetMetamodel(metamodel: cxMetaModel) {
        this.currentTargetMetamodel = metamodel;
    }
    getcurrentTargetMetamodel(): cxMetaModel {
        return this.currentTargetMetamodel;
    }
    setCurrentTargetModel(model: cxModel) {
        this.currentTargetModel = model;
    }
    getCurrentTargetModel(): cxModel {
        return this.currentTargetModel;
    }
    setCurrentTargetModelview(modelview: cxModelView) {
        this.currentTargetModelview = modelview;
    }
    getCurrentTargetModelview(): cxModelView {
        return this.currentTargetModelview;
    }
    setRepository(rep: cxRepository) {
        this.repository = rep;
        this.repositoryRef = rep.id;
    }
}

// -------  cxMetaObject - Den mest supre av alle supertyper  ----------------

export class cxMetaObject {
    //metis:          cxMetis;
    id:             string;
    name:           string;
    nameId:         string;
    class:          string;
    category:       string;
    description:    string;
    deleted:        boolean;
    modified:       boolean;
    fs_collection:  string;
    // Constructor
    constructor(id: string, name: string, description: string) {
        this.class = this.constructor.name;
        this.fs_collection = "";  // Firestore collection
        this.id = id;
        this.name = name;
        this.nameId = name;
        this.category = "";
        this.deleted = false;
        this.modified = false;
        if (name == null) this.name = id;
        if (description == null) 
            this.description = "";
        else
            this.description = description;
    }
    // Methods
    getNameId(): string {
        let txt = this.name;
        txt.replace(/ /g, '_').replace(/./g, '_');
        return txt;
    }
    getClass(): string {
        return this.class;
    }
    getId(): string {
        if (utils.objExists(this.id))
            return this.id;
        else
            return "";
    }
    getCategory(): string {
        return this.category;
    }
    setCategory(category: string) {
        this.category = category;
    }
    setName(name: string) {
        this.name = name;
    }
    getName(): string {
        if (utils.objExists(this.name))
            return this.name;
        else
            return "";
    }
    setDescription(description: string) {
        this.description = description;
    }
    getDescription(): string {
        if (utils.objExists(this.description))
            return this.description;
        else
            return "";
    }
    setDeleted(deleted: boolean) {
        this.deleted = deleted;
    }
    getDeleted(): boolean {
        return this.deleted;
    }
    isDeleted(): boolean {
        return this.deleted;
    }
    setModified() {
        this.modified = true;
    }
    clearModified() {
        this.modified = false;
    }
    isModified() {
        return this.modified;
    }
    setFirestoreCollection(fs_collection: string) {
        this.fs_collection = fs_collection;
    }
    getFirestoreCollection(): string {
        return this.fs_collection;
    }
    getFirestoreId(): string {
        return this.getFirestoreCollection() + "/" + this.getId();
    }
}

// ---------  Data Types, Categories and Units --------------------------

export class cxRepository extends cxMetaObject {
    constructor(id: string, name: string, description: string) {
        super(id, name, description);   
    } 
}

export class cxDatatype extends cxMetaObject {
    isOfDatatype:       cxDatatype | null;
    allowedValues:      any;   // array of strings ??
    defaultValue:       string;
    inputPattern:       string;
    valueFormat:        string;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.class = 'cxDatatype';
        this.fs_collection = constants.fs.FS_C_DATATYPES;  // Firestore collection
        this.category = constants.gojs.C_DATATYPE;
        this.inputPattern = "";
        this.valueFormat = "%s";
        this.isOfDatatype = null;
        this.allowedValues = "";
        this.defaultValue = "";
    }
    // Methods
    addAllowedValue(value: string) {
        let l = 0;
        if (utils.objExists(this.allowedValues))
            l = this.allowedValues.length;
        if (l == 0) {
            this.allowedValues = new Array();
            this.allowedValues.push(value);
        } else {
            if (!utils.nameExistsInNames(this.allowedValues, value))
                this.allowedValues.push(value);
        }
    }
    getAllowedValues() {
        return this.allowedValues;
    }
    setDefaultValue(val: string) {
        this.defaultValue = val;
    }
    getDefaultValue(): string {
        return this.defaultValue;
    }
    setIsOfDatatype(dtype: cxDatatype) {
        this.isOfDatatype = dtype;
    }
    getIsOfDatatype(): cxDatatype | null {
        return this.isOfDatatype;
    }
    setInputPattern(val: string) {
        this.inputPattern = val;
    }
    getInputPattern(): string {
        return this.inputPattern;
    }
    setValueFormat(val: string) {
        this.valueFormat = val;
    }
    getValueFormat(): string {
        return this.valueFormat;
    }
}

export class cxUnitCategory extends cxMetaObject {
    units: cxUnit[] | null;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.class = 'cxUnitCategory';
        this.fs_collection = constants.fs.FS_C_CATEGORIES;  // Firestore collection
        this.category = constants.gojs.C_UNITCATEGORY;
        this.units = null;
    }
    // Methods
    addUnit(unit: cxUnit) {
        // Check if input is of correct class and not already in list (TBD)
        if (unit.class === "cxUnit") {
            if (this.units == null)
                this.units = new Array();
            this.units.push(unit);
        }
    }
}

export class cxUnit extends cxMetaObject {
    unitCategory: cxUnitCategory | null;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.class = 'cxUnit';
        this.fs_collection = constants.fs.FS_C_UNITS;  // Firestore collection
        this.unitCategory = null;
    }
    // Methods
    setUnitCategory(cat: cxUnitCategory) {
        if (utils.objExists(cat)) {
            if (cat.class === "cxUnitCategory") {
                this.unitCategory = cat;
            }
        }
    }
    getUnitCategory() {
        return this.unitCategory;
    }
}

export class cxEnumeration extends cxMetaObject {
    enumvalues: any // array of enum values
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.class = 'cxEnumeration';
        this.fs_collection = constants.fs.FS_C_ENUMERATIONS;  // Firestore collection
        this.category = constants.gojs.C_ENUMERATION;
        this.enumvalues = null;
    }
    // Methods
    addEnum(enumValue: any) {
        // If value already exists, do nothing, else
        if (utils.objExists(enumValue)) {
            if (this.enumvalues == null)
                this.enumvalues = new Array();
            this.enumvalues.push(enumValue);
        }
    }
    enumValueExists(enumValue: any) {
        if (utils.isArrayEmpty(this.enumvalues))
            return false;
        else {
            let i = 0;
            let enumval = null;
            while (i < this.enumvalues.length) {
                enumval = this.enumvalues[i];
                if (enumval.id === enumValue)
                    return true;
                i++;
            }
        }
        return false;
    }
}

// -------------------------------------------------------------

export class cxMetaModel extends cxMetaObject {
    isEKA: boolean;
    metamodels: cxMetaModel[] | null;
    containers: cxMetaContainer[] | null;
    objecttypes: cxObjectType[] | null;
    objtypegeos: cxObjtypeGeo[] | null;
    objecttypeviews: cxObjectTypeView[] | null;
    relshiptypes: cxRelationshipType[] | null;
    relshiptypeviews: cxRelationshipTypeView[] | null;
    properties: cxProperty[] | null;
    enumerations: cxEnumeration[] | null;
    units: cxUnit[] | null;
    datatypes: cxDatatype[] | null;
    viewformats: cxViewFormat[] | null;
    inputpatterns: cxInputPattern[] | null;
    categories: cxUnitCategory[] | null;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_METAMODELS;  // Firestore collection
        this.class = 'cxMetaModel';
        this.category = constants.gojs.C_METAMODEL;
        this.metamodels = null;
        this.containers = null;
        this.objecttypes = null;
        this.objtypegeos = null;
        this.objecttypeviews = null;
        this.relshiptypes = null;
        this.relshiptypeviews = null;
        this.properties = null;
        this.enumerations = null;
        this.units = null;
        this.datatypes = null;
        this.categories = null;
        this.isEKA = false;
    }
    // Methods
    getLoc(type: cxObjectType) {
        let retval = "";
        if (utils.objExists(type)) {
            let geos = this.objtypegeos;
            if (geos) {
                let geo = null;
                for (let i = 0; i < geos.length; i++) {
                    geo = geos[i];
                    if (geo) {
                        if (geo) {
                            let geotype = geo.type;
                            if (geotype) {
                                if (geotype.id === type.id) {
                                    retval = geo.loc;
                                    break;
                                }
                            }
                        }
                    }
                    if (!geo) {
                        geo = this.setLoc(type, "");
                        retval = "";
                    }
                }
            }
        }
        return retval;
    }
    setLoc(type: cxObjectType, loc: string) {
        let geo = null;
        if (utils.objExists(type)) {
            let geos = this.objtypegeos;
            if (geos) {
                for (let i = 0; i < geos.length; i++) {
                    geo = geos[i];
                    if (geo) {
                        let geotype = geo.type;
                        if (geotype) {
                            if (geotype.id === type.id) {
                                geo.loc = loc;
                                return geo;
                            }
                        }
                    }
                }
            } else {
                geo = new cxObjtypeGeo(utils.createGuid(), this, type, loc, "");
                this.addObjtypeGeo(geo);
            }
        }
        return geo;
    }
    getSize(type: cxObjectType) {
        let retval = "";
        if (type) {
            let geos = this.objtypegeos;
            if (geos) {
                let geo = null;
                for (let i = 0; i < geos.length; i++) {
                    geo = geos[i];
                    if (geo) {
                        let geotype = geo.type;
                        if (geotype) {
                            if (geotype.id === type.id) {
                                retval = geo.size;
                                break;
                            }
                        }
                    }
                }
            }
        }
        return retval;
    }
    setSize(type: cxObjectType, size: string) {
        let geo = null;
        if (size == undefined)
            size = "";
        if (type) {
            let geos = this.objtypegeos;
            if (geos) {
                for (let i = 0; i < geos.length; i++) {
                    geo = geos[i];
                    if (geo) {
                        let geotype = geo.type;
                        if (geotype) {
                            if (geotype.id === type.id) {
                                geo.size = size;
                                return geo;
                            }
                        }
                    }
                }
            } else {
                geo = new cxObjtypeGeo(utils.createGuid(), this, type, "", size);
                this.addObjtypeGeo(geo);
            }
        }
        return geo;
    }
    close() {
        this.metamodels = null;
        this.objecttypes = null;
        this.objecttypeviews = null;
        this.relshiptypes = null;
        this.relshiptypeviews = null;
        this.properties = null;
        this.enumerations = null;
        this.units = null;
        this.datatypes = null;
        this.categories = null;
        this.description = "";
        this.name = "";
        this.id = "";
    }
    send(): string {
        let result = "Metamodel<br>";
        result += "id: " + this.id + "<br>";
        result += "name: " + this.name + "<br>";
        if (this.description.length > 0)
            result += "description: " + this.description + "<br>";
        if (this.objecttypes) {
            let l = this.objecttypes.length;
            if (l > 0) result += "Object types:<br>"
            for (let i = 0; i < l; i++) {
                result += this.sendItem(this.objecttypes[i]);
            }
        }
        return result;
    }
    sendItem(item: any): string {
        let result = "    id: " + item.id + "<br>";
        result += "    name: " + item.name + "<br>";
        if (item.description.length > 0)
            result += "    description: " + item.description + "<br>";
        return result;
    }
    getCategories() {
        return this.categories;
    }
    getDatatypes() {
        return this.datatypes;
    }
    getViewFormats() {
        return this.viewformats;
    }
    getInputPatterns() {
        return this.inputpatterns;
    }
    getEnumerations() {
        return this.enumerations;
    }
    getObjtypeNames() {
        const names = new Array();
        const types = this.getObjectTypes();
        if (types) {
            for (let i = 0; i < types.length; i++) {
                const type = types[i];
                const name = type.getName();
                if (!utils.nameExistsInNames(names, name))
                    names.push(name);
            }
        }
        return names;
    }
    getObjectTypes() {
        return this.objecttypes;
    }
    getObjectTypeViews() {
        return this.objecttypeviews;
    }
    getObjtypeGeos() {
        return this.objtypegeos;
    }
    getProperties() {
        return this.properties;
    }
    getReltypeNames(ignoreGen: boolean) {
        const names = new Array();
        const types = this.getRelshipTypes();
        if (types) {
            for (let i = 0; i < types.length; i++) {
                const type = types[i];
                if (ignoreGen) {
                    if (type.getRelshipKind() === constants.relkinds.GEN)
                        continue;
                }
                const name = type.getName();
                if (!utils.nameExistsInNames(names, name))
                    names.push(name);
            }
            names.sort();
        }
        return names;
    }
    getEkaReltypeNames() {
        const names = new Array();
        const types = this.getObjectTypes();
        if (types) {
            for (let i = 0; i < types.length; i++) {
                const type = types[i];
                if (type.getViewKind() !== constants.viewkinds.REL) {
                    continue;
                }
                const name = type.getName();
                if (!utils.nameExistsInNames(names, name))
                    names.push(name);
            }
            names.sort();
        }
        return names;
    }
    getRelshipTypes() {
        return this.relshiptypes;
    }
    getRelshipTypeViews() {
        return this.relshiptypeviews;
    }
    getSubMetamodels() {
        return this.metamodels;
    }
    getMetaContainers() {
        return this.containers;
    }
    getUnits() {
        return this.units;
    }
    addItem(item: any) { // Specify types
        switch (item.class) {
            case 'cxMetaModel':
                this.addMetamodel(item);
                break;
            case 'cxDatatype':
                this.addDatatype(item);
                break;
            case 'cxObjectType':
                this.addObjectType(item);
                break;
            case 'cxRelationshipType':
                this.addRelationshipType(item);
                break;
            case 'cxProperty':
                this.addProperty(item);
                break;
            case 'cxObjectTypeView':
                this.addObjectTypeView(item);
                break;
            case 'cxRelationshipTypeView':
                this.addRelationshipTypeView(item);
                break;
        }
    }
    addMetamodel(metamodel: cxMetaModel) {
        // Check if input is of correct class and not already in list (TBD)
        if (metamodel.class === "cxMetaModel") {
            if (this.metamodels == null)
                this.metamodels = new Array();
            if (!this.findSubMetamodel(metamodel.id))
                this.metamodels.push(metamodel);
        }
    }
    addDatatype(datatype: cxDatatype) {
        // Check if input is of correct class and not already in list (TBD)
        if (datatype.class === "cxDatatype") {
            if (this.datatypes == null)
                this.datatypes = new Array();
            if (!this.findDatatype(datatype.id))
                this.datatypes.push(datatype);
        }
    }
    addViewFormat(fmt: cxViewFormat) {
        if (fmt.class === "cxViewFormat") {
            //dtype.setMetis(this);
            if (this.viewformats == null)
                this.viewformats = new Array();
            if (!this.findViewFormat(fmt.id))
                this.viewformats.push(fmt);
        }
    }
    addInputPattern(pattern: cxInputPattern) {
        if (pattern.class === "cxInputPattern") {
            //dtype.setMetis(this);
            if (this.inputpatterns == null)
                this.inputpatterns = new Array();
            if (!this.findInputPattern(pattern.id))
                this.inputpatterns.push(pattern);
        }
    }
    addEnumeration(Enum: cxEnumeration) {
        // Check if input is of correct class and not already in list (TBD)
        if (Enum.class === "cxEnumeration") {
            if (this.enumerations == null)
                this.enumerations = new Array();
            if (!this.findEnumeration(Enum.id))
                this.enumerations.push(Enum);
        }
    }
    addObjectType(objType: cxObjectType) {
        // Check if input is of correct class and not already in list (TBD)
        if (objType.class === "cxObjectType") {
            if (this.objecttypes == null)
                this.objecttypes = new Array();
            if (!this.findObjectType(objType.id))
                this.objecttypes.push(objType);
        }
    }
    addObjectTypeView(objtypeView: cxObjectTypeView) {
        // Check if input is of correct class and not already in list (TBD)
        if (objtypeView.class === "cxObjectTypeView") {
            if (this.objecttypeviews == null)
                this.objecttypeviews = new Array();
            if (!this.findObjectTypeView(objtypeView.id))
                this.objecttypeviews.push(objtypeView);
        }
    }
    addObjtypeGeo(objtypegeo: cxObjtypeGeo) {
        if (objtypegeo.class === "cxObjtypeGeo") {
            if (this.objtypegeos == null)
                this.objtypegeos = new Array();
            if (!this.findObjtypeGeo(objtypegeo.id))
                this.objtypegeos.push(objtypegeo);
        }
    }
    addProperty(prop: cxProperty) {
        // Check if input is of correct class and not already in list (TBD)
        if (prop.class === "cxProperty") {
            if (this.properties == null)
                this.properties = new Array();
            if (!this.findProperty(prop.id))
                this.properties.push(prop);
        }
    }
    addRelationshipType(relType: cxRelationshipType) {
        // Check if input is of correct class and not already in list (TBD)
        if (relType.class === "cxRelationshipType") {
            if (this.relshiptypes == null)
                this.relshiptypes = new Array();
            if (!this.findRelationshipType(relType.id)) {
                this.relshiptypes.push(relType);
            }
        }
    }
    addRelationshipTypeView(reltypeView: cxRelationshipTypeView) {
        // Check if input is of correct class and not already in list (TBD)
        if (reltypeView.class === "cxRelationshipTypeView") {
            if (this.relshiptypeviews == null)
                this.relshiptypeviews = new Array();
            if (!this.findRelationshipTypeView(reltypeView.id))
                this.relshiptypeviews.push(reltypeView);
        }
    }
    addSubMetamodel(metamodel: cxMetaModel) {
        // Check if input is of correct class and not already in list (TBD)
        if (metamodel.class === "cxMetaModel") {
            if (this.metamodels == null)
                this.metamodels = new Array();
            if (!this.findSubMetamodel(metamodel.id))
                this.metamodels.push(metamodel);
        }
    }
    addMetaContainer(container: cxMetaContainer) {
        // Check if input is of correct class and not already in list (TBD)
        if (container.class === "cxMetaContainer") {
            if (this.containers == null)
                this.containers = new Array();
            if (!this.findMetaContainer(container.id))
                this.containers.push(container);
        }
    }
    addUnit(unit: cxUnit) {
        // Check if input is of correct class and not already in list (TBD)
        if (unit.class === "cxUnit") {
            if (this.units == null)
                this.units = new Array();
            let name = unit.getName();
            for (let i = 0; i < this.units.length; i++) {
                let u = this.units[i];
                if (u.getName() === name)
                    return;
            }
            this.units.push(unit);
        }
    }
    addUnitCategory(category: cxUnitCategory) {
        // Check if input is of correct class and not already in list (TBD)
        if (category.class === "cxUnitCategory") {
            if (this.categories == null)
                this.categories = new Array();
            if (!this.findUnitCategory(category.id))
                this.categories.push(category);
        }
    }
    findDatatype(id: string) {
        let datatypes = this.getDatatypes();
        if (!datatypes) return null;
        let i = 0;
        let datatype = null;
        for (i = 0; i < datatypes.length; i++) {
            datatype = datatypes[i];
            if (datatype.isDeleted()) continue;
            if (datatype.id === id)
                return datatype;
        }
        return null;
    }
    findDatatypeByName(name: string) {
        let datatypes = this.getDatatypes();
        if (!datatypes) return null;
        let i = 0;
        let dtype = null;
        for (i = 0; i < datatypes.length; i++) {
            dtype = datatypes[i];
            if (dtype.isDeleted()) continue;
            if (dtype.getName() === name)
                return dtype;
        }

        return null;
    }
    findViewFormat(id: string) {
        let formats = this.getViewFormats();
        if (!formats)
            return null;
        else {
            let i = 0;
            while (i < formats.length) {
                let format = formats[i];
                if (format && format.id === id)
                    return format;
                i++;
            }
        }
        return null;
    }
    findInputPattern(id: string) {
        let patterns = this.getInputPatterns();
        if (!patterns)
            return null;
        else {
            let i = 0;
            while (i < patterns.length) {
                let pattern = patterns[i];
                if (pattern && pattern.id === id)
                    return pattern;
                i++;
            }
        }
        return null;
    }
    findEnumeration(id: string) {
        const enums = this.getEnumerations();
        if (!enums) return null;
        let i = 0;
        let Enum = null;
        while (i < enums.length) {
            Enum = enums[i];
            if (Enum.id === id)
                return Enum;
            i++;
        }

        return null;
    }
    findObjectType(id: string) {
        const types = this.getObjectTypes();
        if (!types) return null;
        let i = 0;
        let objtype = null;
        for (i = 0; i < types.length; i++) {
            objtype = types[i];
            if (objtype) {
                if (objtype.isDeleted()) continue;
                if (objtype.id === id)
                    return objtype;
                else if (objtype.getFirestoreId() === id)
                    return objtype;
            }
        }
        return null;
    }
    findObjectTypeByName(name: string) {
        const types = this.getObjectTypes();
        if (!types) return null;
        let i = 0;
        let objtype = null;
        for (i = 0; i < types.length; i++) {
            objtype = types[i];
            if (objtype.isDeleted()) continue;
            if (objtype.getName() === name)
                return objtype;
        }
        return null;
    }
    findObjectTypeView(id: string) {
        const typeviews = this.getObjectTypeViews();
        if (!typeviews) return null;
        let i = 0;
        let objecttypeview = null;
        for (i = 0; i < typeviews.length; i++) {
            objecttypeview = typeviews[i];
            if (objecttypeview) {
                if (objecttypeview.isDeleted()) continue;
                if (objecttypeview.id === id)
                    return objecttypeview;
                else if (objecttypeview.getFirestoreId() === id)
                    return objecttypeview;
            }
        }
        return null;
    }
    findObjectTypeViewByName(name: string) {
        let typeviews = this.getObjectTypeViews();
        if (!typeviews) return null;
        let i = 0;
        let objecttypeview = null;
        for (i = 0; i < typeviews.length; i++) {
            objecttypeview = typeviews[i];
            if (objecttypeview.isDeleted()) continue;
            if (objecttypeview.getName() === name)
                return objecttypeview;
        }
        return null;
    }
    findObjtypeGeo(id: string) {
        let objtypegeos = this.getObjtypeGeos();
        if (!objtypegeos) return null;
        let i = 0;
        let objtypegeo = null;
        while (i < objtypegeos.length) {
            objtypegeo = objtypegeos[i];
            if (objtypegeo) {
                if (objtypegeo.id === id)
                    return objtypegeo;
                else if (objtypegeo.getFirestoreId() === id)
                    return objtypegeo;
            }
            i++;
        }
        return null;
    }
    findObjtypeGeoByType(type: cxObjectType) {
        let geos = this.getObjtypeGeos();
        if (!geos) return null;
        for (let i = 0; i < geos.length; i++) {
            let geo = geos[i];
            if (geo) {
                if (geo.type) {
                    if (geo.type.id === type.id) {
                        return geo;
                    }
                }
            }
        }
        return null;
    }
    findProperty(id: string) {
        let properties = this.getProperties();
        if (!properties) return null;
        let i = 0;
        let prop = null;
        for (i = 0; i < properties.length; i++) {
            prop = properties[i];
            if (prop && prop.isDeleted) continue;
            if (prop.id === id)
                return prop;
        }
        return null;
    }
    findPropertyByName(name: string) {
        const props = this.getProperties();
        if (!props) return null;
        let i = 0;
        let prop = null;
        for (i = 0; i < props.length; i++) {
            prop = props[i];
            if (prop.isDeleted()) continue;
            if (prop.getName() === name)
                return prop;
        }
        return null;
    }
    findRelationshipType(id: string) {
        const types = this.getRelshipTypes();
        if (!types) return null;
        let i = 0;
        let reltype: cxRelationshipType | null = null;
        for (i = 0; i < types.length; i++) {
            reltype = types[i];
            if (reltype) {
                if (reltype.isDeleted()) continue;
                if (reltype.id === id)
                    return reltype;
                else if (reltype.getFirestoreId() === id)
                    return reltype;
            }
        }
        return null;
    }
    findRelationshipTypeByName(name: string) {
        const types = this.getRelshipTypes();
        if (!types) return null;
        let i = 0;
        let reltype: cxRelationshipType | null = null;
        for (i = 0; i < types.length; i++) {
            reltype = types[i];
            if (reltype.isDeleted()) continue;
            if (reltype.getName() === name)
                return reltype;
        }
        return null;
    }
    findRelationshipTypeByName2(name: string, fromObjType: cxObjectType, toObjType: cxObjectType) {
        const types = this.getRelshipTypes();
        if (!types) {
            return null;
        } else {
            let i = 0;
            let reltype: cxRelationshipType | null = null;
            while (i < types.length) {
                reltype = types[i];
                if (reltype.isDeleted()) continue;
                if (reltype.getName() === name) {
                    if (debug) console.log('2568 reltype', reltype, fromObjType, toObjType);
                    if (reltype.isAllowedFromType(fromObjType, this.objecttypes, this.relshiptypes)) {
                        if (reltype.isAllowedToType(toObjType, this.objecttypes, this.relshiptypes)) {
                            return reltype;
                        }
                    }
                }
                i++;
            }
        }
        return null;
    }
    findRelationshipTypeByNames(reltypeName: string, fromtypeName: string, totypeName: string) {
        let types = this.getRelshipTypes();
        if (!types) return null;
        let i = 0;
        let reltype = null;
        for (i = 0; i < types.length; i++) {
            reltype = types[i];
            if (reltype.isDeleted()) continue;
            if (reltype.getName() === reltypeName) {
                let fromObjtype = reltype.getFromObjType();
                let toObjtype = reltype.getToObjType();
                if (fromObjtype && toObjtype &&
                    (fromObjtype.getName() === fromtypeName && toObjtype.getName() === totypeName))
                    return reltype;
            }
        }
        return null;
    }
    findRelationshipTypesByName(name: string) {
        let types = this.getRelshipTypes();
        if (!types) return null;
        let reltypes = new Array();
        let i = 0;
        let reltype = null;
        for (i = 0; i < types.length; i++) {
            reltype = types[i];
            if (reltype.isDeleted()) continue;
            if (reltype.getName() === name)
                reltypes.push(reltype);
        }
        return reltypes;
    }
    findEkaRelationshipTypeByName(name: string) {
        const types = this.getObjectTypes();
        if (!types) return null;
        let i = 0;
        let objtype = null;
        for (i = 0; i < types.length; i++) {
            objtype = types[i];
            if (objtype.isDeleted()) continue;
            if (objtype.getViewKind() === constants.VIEWKINDS.REL) {
                if (objtype.getName() === name)
                    return objtype;
            }
        }
        return null;
    }
    findRelationshipTypesBetweenTypes(fromType: cxObjectType, toType: cxObjectType, includeGen: boolean) {
        if (!fromType || !toType) return null;
        const types = this.getRelshipTypes();
        if (!types) return null;
        const reltypes = new Array();
        let i = 0;
        let reltype = null;
        for (i = 0; i < types.length; i++) {
            reltype = types[i];
            if (reltype.isDeleted()) continue;
            if (includeGen) {
                if (reltype.isAllowedFromType(fromType, this.objecttypes, this.relshiptypes)) {
                    if (reltype.isAllowedToType(toType, this.objecttypes, this.relshiptypes)) {
                        reltypes.push(reltype);
                    }
                }
            } else
                if (reltype.getRelshipKind() !== constants.relkinds.GEN) {
                    if (reltype.isAllowedFromType(fromType, this.objecttypes, this.relshiptypes)) {
                        if (reltype.isAllowedToType(toType)) {
                            reltypes.push(reltype);
                        }
                    }
                }
        }
        return reltypes;
    }
    findRelationshipTypeView(id: string) {
        if (!this.relshiptypeviews) return null;
        let i = 0;
        let relshiptypeview = null;
        for (i = 0; i < this.relshiptypeviews.length; i++) {
            relshiptypeview = this.relshiptypeviews[i];
            if (relshiptypeview) {
                if (relshiptypeview.isDeleted()) continue;
                if (relshiptypeview.id === id)
                    return relshiptypeview;
                else if (relshiptypeview.getFirestoreId() === id)
                    return relshiptypeview;
            }
        }
        return null;
    }
    findSubMetamodel(id: string) {
        let submetamodels = this.getSubMetamodels();
        if (!submetamodels) return null;
        let i = 0;
        let submeta = null;
        for (i = 0; i < submetamodels.length; i++) {
            submeta = submetamodels[i];
            if (submeta.isDeleted()) continue;
            if (submeta.id === id)
                return submeta;
        }
        return null;
    }
    findMetaContainer(id: string) {
        let containers = this.getMetaContainers();
        if (!containers) return null;
        let i = 0;
        let container = null;
        for (i = 0; i < containers.length; i++) {
            container = containers[i];
            if (container.isDeleted()) continue;
            if (container.id === id)
                return container;
        }
        return null;
    }
    findUnit(id: string) {
        let units = this.getUnits();
        if (!units) return null;
        let i = 0;
        let unit = null;
        for (i = 0; i < units.length; i++) {
            unit = units[i];
            if (unit.isDeleted()) continue;
            if (unit.id === id)
                return unit;
        }
        return null;
    }
    findUnitByName(name: string) {
        let units = this.getUnits();
        if (!units) return null;
        let i = 0;
        let unit = null;
        while (i < units.length) {
            unit = units[i];
            let name = unit.getName();
            if (name.toLowerCase() === name.toLowerCase())
                return unit;
            i++;
        }
        return null;
    }
    findUnitCategory(id: string) {
        let unitCategories = this.getCategories();
        if (!unitCategories) return null;
        let i = 0;
        let category = null;
        for (i = 0; i < unitCategories.length; i++) {
            category = unitCategories[i];
            if (category.isDeleted()) continue;
            if (category.id === id)
                return category;
        }
        return null;
    }
    setIsEKA(flag: boolean) {
        this.isEKA = flag;
    }
    getIsEKA() {
        return this.isEKA;
    }
}

export class cxMetaContainer extends cxMetaObject {
    members: cxObjectType[] | null;
    subcontainers: cxMetaContainer[] | null;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.category = constants.gojs.C_CONTAINER;
        this.members = null;
        this.subcontainers = null;
    }
}

export class cxType extends cxMetaObject {
    abstract: boolean;
    supertypes: cxType[] | null;
    properties: cxProperty[] | null;
    methods: any;
    queries: any;
    typeview: cxObjectTypeView | cxRelationshipTypeView | null;
    viewkind: string;
    relshipkind: string;
    defaultValueset: any;
    // Constructor
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.class = 'cxType';
        this.abstract = false;
        this.supertypes = null;
        this.fs_collection = "types"; // Firestore collection
        this.properties = null;
        this.typeview = null;
        this.viewkind = "";
        this.relshipkind = "";
        this.defaultValueset = null;    // Meant to store default property values
        this.methods = null;
        this.queries = null;
    }
    // Methods
    addSupertype(type: cxType) {
        // Check if input is of correct class and not already in list (TBD)
        if (type.class === "cxType") {
            if (!this.supertypes)
                this.supertypes = new Array();
            this.supertypes.push(type);
        }
    }
    addProperty(prop: cxProperty) {
        const props = new Array();
        const len = this.properties?.length;
        for (let i=0; i<len; i++) {
            const p = this.properties[i];
            props.push(p);
        }
        this.properties = props;
        this.properties.push(prop);
        // Check if input is of correct class and not already in list (TBD)
        // if (prop.class === "cxProperty") {
        //     if (!this.properties)
        //         this.properties = new Array();
        //     if (debug) console.log('2577 addProperty', prop, this.properties);
        //     this.properties.push(prop);
        // }
    }
    addProperty2(id: string, name: string, desc: string, dtype: cxDatatype) {
        // Check if prop already exists
        if (!this.properties)
            this.properties = new Array();
        const prop = new cxProperty(id, name, desc);
        prop.setDescription(desc);
        prop.setDatatype(dtype);
        this.properties.push(prop);
        return prop;
    }
    addMethod(mtd: any) {
        // To be defined
    }
    addQuery(query: any) {
        // To be defined
    }
    findProperty(propid: string) {
        let properties = this.properties;
        if (!properties)
            return null;
        const noProperties = properties.length;
        let i = 0;
        while (i < noProperties) {
            if (properties[i].id === propid)
                return properties[i];
            i++;
        }
        return null;
    }
    findPropertyByName(propname: string) {
        let properties = this.properties;
        if (!properties) {
            return null;
        } else {
            const noProperties = properties.length;
            let i = 0;
            while (i < noProperties) {
                if (properties[i].name === propname)
                    return properties[i];
                i++;
            }
            return null;
        }
    }
    getViewKind() {
        if (utils.objExists(this.viewkind))
            return this.viewkind;
        else
            return "";
    }
    setViewKind(viewkind: string) {
        this.viewkind = viewkind;
    }
    setRelshipKind(kind: string) {
        this.relshipkind = kind;
    }
    getRelshipKind() {
        if (utils.objExists(this.relshipkind))
            return this.relshipkind;
        else
            return constants.relkinds.REL;
    }
    getSupertypes() {
        return this.supertypes;
    }
    getProperties(includeInherited: boolean) {
        if (!utils.objExists(includeInherited))
            return this.properties;
        const properties = new Array();
        if (includeInherited) {
            if (this.supertypes) {
                const noSupertypes = this.supertypes.length;
                const i = 0;
                while (i < noSupertypes) {
                    const supertype = this.supertypes[i];
                    if (supertype) {
                        let superprops = supertype.properties;
                        if (superprops) {
                            // properties.push(...supertype.properties); // => don't remove duplication
                            [...new Set([...properties, ...superprops])]; //   => remove duplication
                        }
                    }
                }
            }
        }
        if (this.properties && this.properties.length > 0)
            properties.push(this.properties);
        return properties;
    }
    hasProperties() {
        if (!utils.objExists(this.properties))
            return false;
        else if (utils.isArrayEmpty(this.properties))
            return false;
        else
            return true;
    }
    getMethods() {
        return this.methods;
    }
    hasMethods() {
        return !utils.isArrayEmpty(this.methods);
    }
    getQueries() {
        return this.queries;
    }
    hasQueries() {
        return !utils.isArrayEmpty(this.queries);
    }
    setAbstract(abstract: boolean) {
        this.abstract = abstract;
    }
    getAbstract() {
        if (utils.objExists(this.abstract))
            return this.abstract;
        else
            return false;
    }
    clearAbstract() {
        this.abstract = false;
    }
    isAbstract() {
        return this.getAbstract();
    }
    setDefaultValueset(valset: any) {
        this.defaultValueset = valset;
    }
    getDefaultTypeView() {
        return this.typeview;
    }
    getDefaultValueset() {
        return this.defaultValueset;
    }
}

export class cxObjectType extends cxType {
    typeid: string;
    typeview: cxObjectTypeView | cxRelationshipTypeView | null;
    typeviewRef: string;
    fromObjtype: cxObjectType | null;
    toObjtype: cxObjectType | null;
    objtypegeos: cxObjtypeGeo[] | null;
    allObjecttypes: cxObjectType [] | null;
    allRelationshiptypes: cxRelationshipType [] | null;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.class = 'cxObjectType';
        this.fs_collection = constants.fs.FS_C_OBJECTTYPES;  // Firestore collection
        this.category = constants.gojs.C_OBJECTTYPE;
        this.typeid = constants.types.OBJECTTYPE_ID;
        this.viewkind = constants.viewkinds.OBJ;
        this.relshipkind = "";
        this.typeview = null;              // Default type view
        this.typeviewRef = "";             // Default type view
        this.fromObjtype = null;
        this.toObjtype = null;
        this.objtypegeos = null;
        this.allObjecttypes = null;
        this.allRelationshiptypes = null;
    }
    // Methods
    getLoc(metamodel: cxMetaModel) {
        if (metamodel?.objtypegeos) {
            let geos = metamodel.objtypegeos;
            if (geos) {
                for (let i = 0; i < geos.length; i++) {
                    let geo = geos[i];
                    if (geo) {
                        if (geo.metamodel) {
                            if (geo.metamodel.id === metamodel.id) {
                                let type = geo.type;
                                if (type) {
                                    if (type.id == this.id)
                                        return geo.loc;
                                }
                            }
                        }
                    }
                }
            }
        }
        return "";
    }
    getSize(metamodel: cxMetaModel) {
        if (metamodel?.objtypegeos) {
            let geos = metamodel.objtypegeos;
            if (geos) {
                for (let i = 0; i < geos.length; i++) {
                    let geo = geos[i];
                    if (geo) {
                        let metageo = geo.metamodel;
                        if (metageo) {
                            if (metageo.id === metamodel.id) {
                                let type = geo.type;
                                if (type) {
                                    if (type.id == this.id)
                                        return geo.size;
                                }
                            }
                        }
                    }
                }
            }
        }
        return "";
    }
    getObjtypeGeos() {
        return this.objtypegeos;
    }
    addObjtypeGeo(geo: cxObjtypeGeo) {
        if (this.objtypegeos == null)
            this.objtypegeos = new Array();
        if (!utils.findObjtypeGeo(geo.id)) {
            this.objtypegeos.push(geo);
        }
    }
    setDefaultTypeView(typeview: cxObjectTypeView | cxRelationshipTypeView) {
        let tv = typeview as cxObjectTypeView;
        if (tv)
            this.typeview = tv;
    }
    getTypeId() {
        return this.typeid;
    }
    getDefaultTypeView() {
        return this.typeview;
    }
    newDefaultTypeView(kind: string): cxObjectTypeView | cxRelationshipTypeView {
        const name = this.name + '_' + kind; // objectkind
        const objtypeView = new cxObjectTypeView(utils.createGuid(), name, this, "");
        if (utils.objExists(objtypeView)) {
            objtypeView.setViewKind(this.viewkind);
        }
        this.typeview = objtypeView;
        return this.typeview;
    }
    isInstantiable() {
        let retval = true;
        if (this.deleted)
            retval = false;
        else if (this.abstract)
            retval = false;
        return retval;
    }
    getViewKind() {
        if (utils.objExists(this.viewkind))
            return this.viewkind;
        else
            return "";
    }
    setViewKind(viewkind: string) {
        this.viewkind = viewkind;
    }
    setRelshipKind(kind: string) {
        this.relshipkind = kind;
    }
    getRelshipKind() {
        if (utils.objExists(this.relshipkind))
            return this.relshipkind;
        else
            return constants.relkinds.REL;
    }
    setFromObjtype(fromObjtype: cxObjectType) {
        this.fromObjtype = fromObjtype;
    }
    getFromObjType() {
        return this.fromObjtype;
    }
    setToObjtype(toObjtype: cxObjectType) {
        this.toObjtype = toObjtype;
    }
    getToObjType() {
        return this.toObjtype;
    }
    setAllObjecttypes(objtypes: cxObjectType[]) {
        this.allObjecttypes = objtypes;
    }
    getAllObjecttypes() {
        return this.allObjecttypes;
    }
    setAllRelationshiptypes(reltypes: cxRelationshipType[]) {
        this.allRelationshiptypes = reltypes;
    }
    getAllRelationshiptypes() {
        return this.allRelationshiptypes;
    }
    isContainer() {
        if (this.viewkind == constants.viewkinds.CONT)
            return true;
        return false;
    }
    findRelatedObjectTypes(relkind: string) {
        const objtypes = new Array();
        const types = this.allRelationshiptypes;
        if (debug) console.log('3061 allReltypes', types);
        if (!types) {
            return null;
        } else {
            let i = 0;
            let reltype = null;
            while (i < types.length) {
                reltype = types[i];
                if (reltype) {
                    if (reltype.getRelshipKind() === relkind) {
                        const fromType = reltype.getFromObjType();
                        if (fromType) {
                            if (debug) console.log('3073 reltype', fromType.name);
                            if (reltype.getFromObjType().id === this.id) {
                                const toType = reltype.getToObjType();
                                if (debug) console.log('3076 reltype', toType.name);
                                objtypes.push(toType);
                            }
                        }
                    }
                }
                i++;
            }
        }
        return objtypes;
    }
    inherits(type: cxObjectType, allReltypes: cxRelationshipType[]) {    // Returns true/false
        // Check if this (objecttype) inherits from type
        if (debug) console.log('3120 this.name, type.name', this.name, type.name);
        let retval = false;
        this.allRelationshiptypes = allReltypes;
        if (this.id === type.id) {
            return true;
        } else {
            const types = this.findRelatedObjectTypes(constants.relkinds.GEN);
            if (debug) console.log('3091 this, types', this, types);
            if (types) {
                for (let i = 0; i < types.length; i++) {
                    if (debug) console.log('3096 this, type', this, type);
                    const supertype = types[i];
                    if (supertype.id === type.id) {
                        if (debug) console.log('3099 Found supertype', supertype.name);
                        return true;
                    } else {
                        if (debug) console.log('3102 find supertype of', supertype.name, supertype);
                        retval = supertype.inherits(type, allReltypes);
                        if (retval)
                            return true;
                    }
                }
            }
        }
        return retval;
    }
    findRelshipTypeByKind(relkind: string, objtype: cxObjectType) {                           // .COMP
        let rtype: cxRelationshipType | null = this.findRelshipTypeByKind1(relkind, objtype, this.allRelationshiptypes);
        if (rtype) return rtype;
        // Check if this has a relkind to another type
        rtype = this.findRelshipTypeByKind2(relkind, objtype);
        if (rtype) return rtype;

        // Check if this has a relationship to a super of objtype
        rtype = this.findRelshipTypeByKind3(relkind, objtype);
        return rtype;
    }
    findRelshipTypeByKind1(relkind: string, objtype: cxObjectType, allReltypes: cxRelationshipType[]): cxRelationshipType | null {
        if (!allReltypes) {
            return null;
        } else {
            let i = 0;
            let reltype: cxRelationshipType | null;
            while (i < allReltypes.length) {
                reltype = allReltypes[i];
                if (reltype && (reltype.getRelshipKind() === relkind)) {
                    const fromtype = reltype.getFromObjType();
                    if (fromtype && fromtype.id === this.id) {
                        const totype = reltype.getToObjType();
                        if (totype && totype.id === objtype.id) {
                            return reltype;
                        } else {
                            const rkind: string = constants.relkinds.GEN;
                            const otypes = objtype.findRelatedObjectTypes(rkind);
                            if (otypes) {
                                for (let j = 0; j < otypes.length; j++) {
                                    const otype = otypes[j];
                                    const rtype: cxRelationshipType | null = this.findRelshipTypeByKind1(relkind, otype, allReltypes);
                                    if (rtype) return rtype;
                                }
                            }
                        }
                    }
                }
                i++;
            }
        }
        return null;
    }
    findRelshipTypeByKind2(relkind: string, objtype: cxObjectType): cxRelationshipType | null {
        // Check if this has a relkind to another type
        const otypes = this.findRelatedObjectTypes(relkind);
        if (otypes && otypes.length > 0) {
            for (let j = 0; j < otypes.length; j++) {
                const otype = otypes[j];
                // objtype inherits from otype?
                if (objtype.inherits(otype, this.allRelationshiptypes)) {
                    const rtype: cxRelationshipType | null = this.findRelshipTypeByKind1(relkind, otype, this.allRelationshiptypes);
                    if (rtype)
                        return rtype;
                } else {
                    const rkind = constants.relkinds.GEN;
                    const otypes1 = otype.findRelatedObjectTypes(rkind);
                    if (otypes1.length > 0) {
                        for (let j = 0; j < otypes1.length; j++) {
                            const otype1 = otypes1[j];
                            const rtype1: cxRelationshipType | null = this.findRelshipTypeByKind2(relkind, otype1);
                            if (utils.objExists(rtype1))
                                return rtype1;
                        }
                    }
                }
            }
        }
        return null;
    }
    findRelshipTypeByKind3(relkind: string, objtype: cxObjectType) {
        // Check if this has a relationship to a super of objtype
        const rkind: string = constants.relkinds.GEN;
        const stypes = this.findRelatedObjectTypes(rkind);                // Finds supertype
        if (stypes && stypes.length > 0) {
            for (let j = 0; j < stypes.length; j++) {
                const stype = stypes[j];      // Supertype of objtype
                let rtype = stype.findRelshipTypeByKind1(relkind, objtype);     // Supertype is .COMP ?
                if (utils.objExists(rtype))
                    return rtype;
                else {
                    rtype = stype.findRelshipTypeByKind3(relkind, objtype);
                    if (utils.objExists(rtype))
                        return rtype;
                }
            }
            return null;
        }
    }
}

export class cxObjtypeGeo extends cxMetaObject {
    metamodel: cxMetaModel | null;
    metamodelRef: string;
    type: cxObjectType | null;
    loc: string;
    size: string;
    constructor(id: string, metamodel: cxMetaModel | null, type: cxObjectType | null, loc: string, size: string) {
        super(id, "", "");
        this.class = "cxObjtypeGeo";
        this.fs_collection = "objtypegeos";  // Firestore collection
        this.category = "Object type geo";
        this.metamodel = metamodel;
        this.metamodelRef = "";
        this.type = type;
        this.loc = loc === undefined ? "" : loc;
        this.size = size === undefined ? "" : size;
    }
    getMetamodel() {
        return this.metamodel;
    }
    setMetamodel(metamodel: cxMetaModel) {
        if (utils.objExists(metamodel)) {
            this.metamodel = metamodel;
        }
    }
    getType() {
        return this.type;
    }
    setType(type: cxObjectType) {
        if (type) {
            this.type = type;
        }
    }
    getLoc() {
        return this.loc;
    }
    setLoc(loc: string) {
        this.loc = loc;
    }
    getSize() {
        if (this.size == undefined)
            return "";
        return this.size;
    }
    setSize(size: string) {
        if (size == undefined)
            size = "";
        this.size = size;
    }
}

export class cxRelationshipType extends cxObjectType {
    typeid: string;
    fromObjtype: cxObjectType | null;
    toObjtype: cxObjectType | null;
    relshipkind: string;
    viewkind: string;
    cardinality: string;
    constructor(id: string, name: string, fromObjtype: cxObjectType | null, toObjtype: cxObjectType | null, description: string) {
        super(id, name, description);
        this.class = 'cxRelationshipType';
        this.fs_collection = constants.fs.FS_C_RELSHIPTYPES;     // Firestore collection
        this.category = constants.gojs.C_RELSHIPTYPE;
        this.typeid = constants.types.RELATIONSHIPTYPE_ID;
        this.fromObjtype = fromObjtype;
        this.toObjtype = toObjtype;
        this.relshipkind = constants.relkinds.REL;
        this.viewkind = "";
        this.cardinality = "*";
    }
    // Methods
    setDefaultTypeView(typeview: cxRelationshipTypeView) {
        this.typeview = typeview;
    }
    newDefaultTypeView(relshipkind: string) {
        const name = this.name + '_' + relshipkind;
        const reltypeView = new cxRelationshipTypeView(utils.createGuid(), name, this, "");
        if (utils.objExists(reltypeView)) {
            reltypeView.setRelshipKind(this.relshipkind);
            reltypeView.setFromArrow2(relshipkind);
            reltypeView.setToArrow2(relshipkind);
        }
        this.typeview = reltypeView;
        return this.typeview;
    }
    getDefaultTypeView() {
        return this.typeview;
    }
    setCardinality(cardinality: string) {
        // Check if valid format
        if (true)
            this.cardinality = cardinality; 
    }
    getCardinality() : string {
        return this.cardinality;
    }
    isInstantiable() {
        let retval = true;
        if (this.deleted)
            retval = false;
        else if (this.abstract)
            retval = false;
        return retval;
    }
    isAllowedFromType(objtype: cxObjectType, allObjtypes: cxObjectType[], allReltypes: cxRelationshipType[]) {
        if (this.fromObjtype) {
            if (debug) console.log('3332 objtype', objtype.name, this.fromObjtype.name);
            if (objtype.inherits(this.fromObjtype, allReltypes))
                return true;
        }
        return false;
    }
    isAllowedToType(objtype: cxObjectType, allObjtypes: cxObjectType[], allReltypes: cxRelationshipType[]) {
        if (this.toObjtype) {
            if (debug) console.log('3340 objtype', objtype.name, this.toObjtype.name);
            if (objtype.inherits(this.toObjtype, allReltypes))
                return true;
        }
        return false;
    }
    setFromObjectType(objtype: cxObjectType) {
        this.fromObjtype = objtype;
    }
    setToObjectType(objtype: cxObjectType) {
        this.toObjtype = objtype;
    }
}

export class cxProperty extends cxMetaObject {
    datatype: cxDatatype | null;
    datatypeRef: string;
    unitCategory: cxUnitCategory | null;
    unitCategoryRef: string;
    defaultValue: string;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_PROPERTIES;  // Firestore collection
        this.class = 'cxProperty';
        this.category = constants.gojs.C_PROPERTY;
        this.datatype = null;
        this.datatypeRef = "";            // Neccessary ???
        this.unitCategory = null;
        this.unitCategoryRef = "";
        this.defaultValue = "";
    }
    // Methods
    setDatatype(datatype: cxDatatype) {
        this.datatype = datatype;
    }
    getDatatype() {
        if (utils.objExists(this.datatype))
            return this.datatype;
        else
            return "";
    }
    setUnitCategory(cat: cxUnitCategory) {
        this.unitCategory = cat;
    }
    getUnitCategory() {
        if (utils.objExists(this.unitCategory))
            return this.unitCategory;
        else
            return "";
    }
    // defaultValue is not an object, but a value
    setDefaultValue(value: any) {
        this.defaultValue = value;
    }
    getDefaultValue() {
        if (utils.objExists(this.defaultValue))
            return this.defaultValue;
        else
            return "";
    }
}

// ---------  View Template Defintions  -----------------------------
export class cxObjtypeviewData {
    class: string;
    abstract: boolean;
    isGroup: boolean;              // Container behaviour
    group: string;                // Parent group
    viewkind: string;
    figure: string;
    fillcolor: string;
    strokecolor: string;
    strokewidth: string;
    icon: string;
    constructor() {
        this.class = 'cxObjtypeviewData';
        this.abstract = false;
        this.isGroup = false;              // Container behaviour
        this.group = "";                // Parent group
        this.viewkind = constants.viewkinds.OBJ;
        this.figure = "RoundedRectangle";
        this.fillcolor = "lightyellow";
        this.strokecolor = "black";
        this.strokewidth = "1";
        this.icon = "default.png";
    }
}

export class cxObjectTypeView extends cxMetaObject {
    type: cxType | null;
    typeRef: string;
    data: cxObjtypeviewData;
    constructor(id: string, name: string, type: cxType | null, description: string) {
        super(id, name, description);
        this.class = 'cxObjectTypeView';
        this.fs_collection = constants.fs.FS_C_OBJECTTYPEVIEWS;  // Firestore collection
        this.category = constants.gojs.C_OBJECTTYPEVIEW;
        this.type = type;
        this.typeRef = "";
        this.data = new cxObjtypeviewData();
        if (type) {
            const abs = type.abstract;
            if (abs)
                this.data.abstract = abs;
        }
    }
    // Methods
    applyObjectViewParameters(objview: cxObjectView) {
        if (utils.objExists(objview)) {
            let prop: any;
            let data: any = this.data;
            let otypeview = objview.typeview;
            if (otypeview) {
                let otvdata: any = otypeview.data;
                for (prop in otypeview.data) {
                    data[prop] = otvdata[prop];
                }
            }
        }
    }
    setType(type: cxType) {
        this.type = type;
    }
    getType() {
        return this.type;
    }
    setData(data: any) {
        // If is valid JSON
        this.data = data;
    }
    getData() {
        return this.data;
    }
    setViewKind(viewkind: string) {
        this.data.viewkind = viewkind;
        this.setIsGroup(viewkind);
    }
    getViewKind() {
        if (utils.objExists(this.data.viewkind))
            return this.data.viewkind;
        else
            return constants.viewkinds.OBJ;
    }
    setAbstract(abstract: boolean) {
        this.data.abstract = abstract;
    }
    getAbstract() {
        return this.data.abstract;
    }
    setIsGroup1(flag: boolean) {
        this.data.isGroup = flag;
    }
    setIsGroup(viewkind: string) {
        if (viewkind == constants.viewkinds.CONT) {
            this.data.isGroup = true;
        } else
            this.data.isGroup = false;
    }
    getIsGroup() {
        if (utils.objExists(this.data.isGroup))
            return this.data.isGroup;
        else
            return false;
    }
    getIsContainer() {
        return this.getIsGroup();
    }
    setGroup(group: string) {
        this.data.group = group;
    }
    getGroup() {
        return this.data.group;
    }
    setFigure(figure: string) {
        this.data.figure = figure;
        this.figure = figure;
    }
    getFigure() {
        if (this.data.figure)
            return this.data.figure;
        else if (this.figure)
            return this.figure;
        return "";
    }
    setFillcolor(fillcolor: string) {
        this.data.fillcolor = fillcolor;
        this.fillcolor = fillcolor;
    }
    getFillcolor() {
        if (this.data.fillcolor)
            return this.data.fillcolor;
        else if (this.fillcolor)
            return this.fillcolor;
        return "white";
    }
    setStrokecolor(strokecolor: string) {
        this.data.strokecolor = strokecolor;
        this.strokecolor = strokecolor;
    }
    getStrokecolor() {
        if (this.data.strokecolor)
            return this.data.strokecolor;
        else if (this.strokecolor)
            return this.strokecolor;
        return "black";
    }
    setStrokewidth(strokewidth: string) {
        this.strokewidth = strokewidth;
        this.data.strokewidth = strokewidth;
    }
    getStrokewidth() {
        if (this.data.strokewidth)
            return this.data.strokewidth;
        else if (this.strokewidth)
            return this.strokewidth;
        return "1";
    }
    setIcon(icon: string) { 
        this.data.icon = icon;
        this.icon = icon;
    }
    getIcon() {
        if (this.data.icon)
            return this.data.icon;
        else if (this.icon)
            return this.icon;
        return "";
    }
}

export class cxReltypeviewData {
    abstract:       boolean;
    class:          string;
    relshipkind:    string;
    strokecolor:    string;
    strokewidth:    string;
    dash:           string;
    fromArrow:      string;
    toArrow:        string;
    fromArrowColor: string;
    toArrowColor:   string;
    constructor() {
        this.class          = 'cxReltypeviewData';
        this.abstract       = false;
        this.relshipkind    = constants.relkinds.REL;
        this.strokecolor    = "black";
        this.strokewidth    = "1";
        this.dash           = "[0]";
        this.fromArrow      = "";
        this.toArrow        = "OpenTriangle";
        this.fromArrowColor = "";
        this.toArrowColor   = "white";
    }
}

export class cxRelationshipTypeView extends cxMetaObject {
    type:    cxRelationshipType | null;
    typeRef: string;
    data:    cxReltypeviewData;
    strokecolor:    string;
    strokewidth:    string;
    dash:           string;
    fromArrow:      string;
    toArrow:        string;
    fromArrowColor: string;
    toArrowColor:   string;
    constructor(id: string, name: string, type: cxRelationshipType | null, description: string) {
        super(id, name, description);
        this.class = 'cxRelationshipTypeView';
        this.fs_collection = constants.fs.FS_C_RELSHIPTYPEVIEWS;  // Firestore collection
        this.category = constants.gojs.C_RELSHIPTYPEVIEW;
        this.type = type;
        this.typeRef = "";
        this.data = new cxReltypeviewData();
    }
    // Methods
    applyRelationshipViewParameters(relview: cxRelationshipView) {
        if (relview) {
            let prop: any;
            let data: any = this.data;
            let rview = relview.typeview;
            if (rview) {
                let tvdata: any = rview.data;
                for (prop in rview.data) {
                    data[prop] = tvdata[prop];
                }
            }
        }
    }
    setType(type: cxRelationshipType) {
        this.type = type;
    }
    getType() {
        return this.type;
    }
    setDatatype(data: any) {
        // If is valid JSON
        this.data = data;
    }
    setData(data: any) {
        // If is valid JSON
        this.data = data;
    }
    getData() {
        return this.data;
    }
    setAbstract(abstract: boolean) {
        this.data.abstract = abstract;
    }
    getAbstract() {
        return this.data.abstract;
    }
    setRelshipKind(kind: string) {
        this.data.relshipkind = kind;
        this.setFromArrow2(kind);
        this.setToArrow2(kind);
    }
    getRelshipKind() {
        let retval = this.data.relshipkind;
        if (!retval) {
            let type = this.getType();
            if (type)
                retval = type.getRelshipKind();
        }
        return retval;
    }
    setStrokecolor(strokecolor: string) {
        this.data.strokecolor = strokecolor;
        this.strokecolor = strokecolor;
    }
    getStrokecolor() {
        if (this.data.strokecolor)
            return this.data.strokecolor;
        else if (this.strokecolor)
            return this.strokecolor;
        else
            return "black";
    }
    setStrokewidth(strokewidth: string) {
        this.data.strokewidth = strokewidth;
        this.strokewidth = strokewidth;
    }
    getStrokewidth() {
        if (this.data.strokewidth)
            return this.data.strokewidth;
        else if (this.strokewidth)
            return this.strokewidth;
        return "1";
    }
    setDash(dash: string) {
        this.data.dash = dash;
        this.dash = dash;
    }
    getDash() {
        if (this.data.dash)
            return this.data.dash;
        else if (this.dash)
            return this.dash;
        else
            return "";
    }
    setFromArrow(fromArrow: string) {
        this.data.fromArrow = fromArrow;
        this.fromArrow = fromArrow;
    }
    getFromArrow() {
        if (this.data.fromArrow)
            return this.data.fromArrow;
        else if (this.fromArrow)
            return this.fromArrow;
        return "";
    }
    setToArrow(toArrow: string) {
        this.data.toArrow = toArrow;
        this.toArrow = toArrow;
    }
    setFromArrow2(relshipkind: string) {
        let arrow = '';
        let color = '';
        switch (relshipkind) {
            case 'Composition':
                arrow = 'StretchedDiamond';
                color = "black";
                break;
            case 'Aggregation':
                arrow = 'StretchedDiamond';
                color = 'white';
                break;
            default:
                break;
        }
        this.setFromArrow(arrow);
        this.setFromArrowColor(color);
    }
    setToArrow2(relshipkind: string) {
        let arrow = 'OpenTriangle';
        let color = '';
        switch (relshipkind) {
            case 'Generalization':
                arrow = 'Triangle';
                color = "white";
                break;
            default:
                break;
        }
        this.setToArrow(arrow);
        this.setToArrowColor(color);
    }
    getToArrow() {
        if (this.data.toArrow)
            return this.data.toArrow;
        else if (this.toArrow)
            return this.toArrow;
        return "";
    }
    setFromArrowColor(color: string) {
        this.data.fromArrowColor = color;
        this.fromArrowColor = color;
    }
    getFromArrowColor() {
        if (this.data.fromArrowColor)
            return this.data.fromArrowColor;
        else if (this.fromArrowColor)
            return this.fromArrowColor;
        return "";
    }
    setToArrowColor(color: string) {
        this.data.toArrowColor = color;
        this.toArrowColor = color;
    }
    getToArrowColor() {
        if (this.data.toArrowColor)
            return this.data.toArrowColor;
        else if (this.toArrowColor)
            return this.toArrowColor;
        return "";
    }
}

// ---------------------------------------------------------------------
export class cxModel extends cxMetaObject {
    modeltype: string;
    metamodel: cxMetaModel | null;
    metamodelRef: string;
    targetMetamodelRef: string;
    sourceModelRef: string;
    targetModelRef: string;
    templates: cxModelView[];
    isTemplate: boolean;
    isMetamodel: boolean;
    submodels: cxModel[] | null;
    objects: cxObject[] | null;
    relships: cxRelationship[] | null;
    modelviews: cxModelView[] | null;
    constructor(id: string, name: string, metamodel: cxMetaModel | null, description: string) {
        super(id, name, description);
        this.class = 'cxModel';
        this.fs_collection = constants.fs.FS_C_MODELS;  // Firestore collection
        this.category = constants.gojs.C_MODEL;
        this.modeltype = "";
        this.metamodel = metamodel;
        this.metamodelRef = "";
        this.targetMetamodelRef = "";
        this.sourceModelRef = "";
        this.targetModelRef = "";
        this.templates = null;
        this.isTemplate = false;
        this.isMetamodel = false;
        this.submodels = null;
        this.objects = null;
        this.relships = null;
        this.modelviews = null;
    }
    setModelType(modeltype: string) {
        this.modeltype = modeltype;
    }
    getModelType() {
        return this.modeltype;
    }
    setMetamodel(metamodel: cxMetaModel) {
        this.metamodel = metamodel;
    }
    getMetamodel() {
        return this.metamodel;
    }
    addTemplate(template: cxModelView) {
        if (this.templates == null)
            this.templates = new Array();
        if (!this.findTemplate(template.id))
            this.templates.push(template);
    }
    findTemplate(id: string) {
        const templates = this.getTemplates();
        if (templates) {
            let i = 0;
            let tmpl = null;
            while (i < templates.length) {
                tmpl = templates[i];
                if (tmpl) {
                    if (tmpl.id === id)
                        return tmpl;
                }
                i++;
            }
        }
    }
    getTemplates() {
        return this.templates;
    }
    setIsTemplate(flag: boolean) {
        this.isTemplate = flag;
    }
    getIsTemplate() {
        return this.isTemplate;
    }
    setIsMetamodel(flag: boolean) {
        this.isMetamodel = flag;
    }
    getIsMetamodel() {
        return this.isMetamodel;
    }
    getModelViews() {
        return this.modelviews;
    }
    getObjects() {
        return this.objects;
    }
    getObjectsByType(objtype: cxObjectType, includeSubTypes: boolean) {
        let objects = new Array();
        if (this.objects) {
            for (let i = 0; i < this.objects.length; i++) {
                let obj = this.objects[i];
                if (obj && !obj.deleted) {
                    let type = obj.getType();
                    if (type && type.getId() === objtype.getId()) 
                        objects.push(obj);
                }
            }
            if (includeSubTypes) {
                // get list of subtypes
            }
        }
        return objects;
    }
    getObjectsByTypename(objtypeName: string, includeSubTypes: boolean) {
        let objects = new Array();
        if (this.objects) {
            for (let i = 0; i < this.objects.length; i++) {
                let obj = this.objects[i];
                if (obj && !obj.deleted) {
                    let type = obj.getType();
                    if (type && type.getName() === objtypeName)
                        objects.push(obj);
                }
            }
            if (includeSubTypes) {
                // get list of subtypes
            }
        }
        return objects;
    }
    getRelationships() {
        return this.relships;
    }
    getRelationshipsByType(reltype: cxRelationshipType, includeSubTypes: boolean) {
        let relships = new Array();
        if (this.relships) {
            for (let i = 0; i < this.relships.length; i++) {
                let rel = this.relships[i];
                if (rel && !rel.deleted) {
                    let type = rel.getType();
                    if (type && type.getId() === reltype.getId()) 
                    relships.push(rel);
                }
            }
            if (includeSubTypes) {
                // get list of subtypes
            }
        }
        return relships;
    }
    getSubmodels() {
        return this.submodels;
    }
    addSubmodel(model: cxModel) {
        // Check if input is of correct class and not already in list (TBD)
        if (this.submodels == null)
            this.submodels = new Array();
        
        if (!this.findSubmodel(model.id))
            this.submodels.push(model);
    }
    addModelView(modelview: cxModelView) {
        // Check if input is of correct class and not already in list (TBD)
        if (this.modelviews == null)
            this.modelviews = new Array();
        if (!this.findModelView(modelview.id))
            this.modelviews.push(modelview);
    }
    addObject(obj: cxObject) {
        if (obj.class === "cxObject") {
            if (this.objects == null)
                this.objects = new Array();
            if (!this.findObject(obj.id))
                this.objects.push(obj);
        }
    }
    addRelationship(rel: cxRelationship) {
        if (rel.class === "cxRelationship") {
            if (this.relships == null)
                this.relships = new Array();
            if (!this.findRelationship(rel.id))
                this.relships.push(rel);
        }
    }
    addObjects(...objs: cxObject[]) {
        let i = 0;
        while (i < objs.length) {
            this.addObject(objs[i]);
            i++;
        }
    }
    addRelationships(...rels: cxRelationship[]) {
        let i = 0;
        while (i < rels.length) {
            this.addRelationship(rels[i]);
            i++;
        }
    }
    findSubmodel(id: string) {
        const submodels = this.getSubmodels()
        if (submodels) {
            let i = 0;
            let obj = null;
            while (i < submodels.length) {
                obj = submodels[i];
                if (obj) {
                    if (obj.id === id)
                        return obj;
                    else if (obj.getFirestoreId() === id)
                        return obj;
                }
                i++;
            }
        }
    }
    findModelView(id: string) {
        const modelviews = this.getModelViews();
        if (modelviews) {
            let i = 0;
            let obj = null;
            while (i < modelviews.length) {
                obj = modelviews[i];
                if (obj) {
                    if (obj.id === id)
                        return obj;
                    else if (obj.getFirestoreId() === id)
                        return obj;
                }
                i++;
            }
        }
    }
    findModelViewByName(name: string) {
        const modelviews = this.getModelViews();
        if (modelviews) {
            let i = 0;
            let obj = null;
            while (i < modelviews.length) {
                obj = modelviews[i];
                if (obj) {
                    if (obj.name === name)
                        return obj;
                }
                i++;
            }
        }
    }
    findObject(id: string) {
        let objects = this.getObjects();
        if (!objects) return null;
        let i = 0;
        let obj = null;
        while (i < objects.length) {
            obj = objects[i];
            if (obj) {
                if (obj.id === id)
                    return obj;
                else if (obj.getFirestoreId() === id)
                    return obj;
            }
            i++;
        }
        let relships = this.getRelationships();
        if (relships) {
            return this.findRelationship(id);
        }
        return null;
    }
    findObjectByName(objname: string) {
        let objects = this.getObjects();
        if (!objects)
            return null;
        const noObjects = objects.length;
        let i = 0;
        while (i < noObjects) {
            if (objects[i].getName() === objname)
                return objects[i];
            i++;
        }
        return null;
    }
    findObjectByTypeAndName(objtype: cxObjectType, objname: string) {
        let objects = this.getObjects();
        if (!objects)
            return null;
        const noObjects = objects.length;
        let i = 0;
        while (i < noObjects) {
            let obj = objects[i];
            if (obj) {
                let otype = obj.type;
                if (otype && otype.id === objtype.id) {
                    if (obj.getName() === objname)
                        return obj;
                }
            }
            i++;
        }
        return null;
    }
    findRelationship(id: string) {
        const relships = this.getRelationships();
        if (relships) {
            let i = 0;
            let rel = null;
            while (i < relships.length) {
                rel = relships[i];
                if (rel) {
                    if (rel.id === id)
                        return rel;
                    else if (rel.getFirestoreId() === id)
                        return rel;
                }
                i++;
            }
        }
        return null;
    }
    findRelationship1(fromObj: cxObject, toObj: cxObject, reltype: cxRelationshipType) {
        const relships = this.relships;
        if (relships) {
            const len = utils.objExists(relships) ? relships.length : 0;
            for (let i = 0; i < len; i++) {
                const rel = relships[i];
                if (rel) {
                    let rtype = rel.getType();
                    if (rtype) {
                        let relFromObj = rel.getFromObject();
                        let relToObj = rel.getToObject();
                        if (relFromObj && relToObj) {
                            if (rtype.id === reltype.id) {
                                if (relFromObj.id === fromObj.id) {
                                    if (relToObj.id === toObj.id) {
                                        return rel;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
    findEkaRelationship(fromObj: cxObject, toObj: cxObject, reltype: cxRelationshipType) {
        if (!utils.objExists(fromObj) || !utils.objExists(toObj) || !utils.objExists(reltype))
            return null;
        let objects = this.objects;
        if (objects) {
            let len = objects.length;
            for (let i = 0; i < len; i++) {
                let rel = objects[i];
                let rtype = rel.getType();
                if (rtype) {
                    let relFromObj = rel.getFromObject();
                    let relToObj = rel.getToObject();
                    if (relFromObj && relToObj) {
                        if (rtype.id === reltype.id) {
                            if (relFromObj.id === fromObj.id) {
                                if (relToObj.id === toObj.id) {
                                    return rel;
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
    findRelationships(fromObj: cxObject, toObj: cxObject, relkind: string) {
        const relationships = new Array();
        const relships = this.relships;
        if (relships) {
            const len = utils.objExists(relships) ? relships.length : 0;
            for (let i = 0; i < len; i++) {
                const rel = relships[i];
                const reltype = rel.getType();
                if (reltype && (reltype.getRelshipKind() === relkind)) {
                    let relFromObj = rel.getFromObject();
                    let relToObj = rel.getToObject();
                    if (relFromObj && relToObj) {
                        if (relFromObj.id === fromObj.id) {
                            if (relToObj.id === toObj.id) {
                                relationships.push(rel);
                            }
                        }
                    }
                }
            }
        }
        return relationships;
    }
    deleteObjectViewsWithoutObjects() {
        // Get modelviews
        const mviews = this.modelviews;
        for (let i = 0; i < mviews.length; i++) {
            const mview = mviews[i];
            const oviews = mview.objectviews;
            for (let j = 0; j < oviews.length; j++) {
                const oview = oviews[j];
                if (!oview.object)
                    oview.deleted = true;
            }
        }
    }
}

export class cxInstance extends cxMetaObject {
    type: cxObjectType | cxRelationshipType | null;
    typeRef: string;
    typeName: string;
    typeview: cxObjectTypeView | cxRelationshipTypeView | null;
    typeviewRef: string;
    fromObject: cxInstance | null;
    toObject: cxInstance | null;
    relshipkind: string;
    viewkind: string;
    valueset: any[] | null;
    inputrels: cxRelationship[] | null;
    outputrels: cxRelationship[] | null;
    parentModel: cxModel | null;
    allProperties: cxProperty[] | null;
    constructor(id: string, name: string, type: cxObjectType | cxRelationshipType | null, description: string) {
        super(id, name, description);
        this.class = this.constructor.name;
        this.id = id;
        this.type = type;
        this.typeRef = type?.id;
        this.typeName = type?.name;
        this.typeview = null;
        this.typeviewRef = "";
        this.fromObject = null;
        this.toObject = null;
        this.relshipkind = "";
        this.viewkind = "";
        this.valueset = null;
        this.inputrels = null;
        this.outputrels = null;
        this.parentModel = null;
        this.allProperties = null;
    }
    // Methods
    setAllProperties(allprops: cxProperty[]) {
        this.allProperties = allprops;
    }
    getAllProperties() {
        return this.allProperties;
    }
    addProperties() {
        const properties = this.type.getProperties(true);
        const allProps = this.allProperties;
        for (let i=0; i<properties.length; i++) {
            const prop = properties[i]; 
            let found = false;
            // Check if prop is globally defined
            for (let j=0; j<allProps.length; j++) {
                const p = allProps[j];
                if (p.id === prop.id) {
                    found = true;
                    break;
                }
            }
            if (found) {
                const value = prop.getDefaultValue();
                const propval = new cxPropertyValue(prop, value);
                if (this.valueset == null)
                    this.valueset = new Array();
                this.valueset.push(propval);
            }
        }
    }
    addInputrel(relship: cxRelationship) {
        if (!this.inputrels)
            this.inputrels = new Array();
        const len = this.inputrels.length;
        for (let i=0; i<len; i++) {
            const rel = this.inputrels[i];
            if (rel.id === relship.id) {
                // Relationship is already in list
                return;
            }
        }
        this.inputrels.push(relship);
    }
    addOutputrel(relship: cxRelationship) {
        if (!this.outputrels)
            this.outputrels = new Array();
        const len = this.outputrels.length;
        for (let i=0; i<len; i++) {
            const rel = this.outputrels[i];
            if (rel.id === relship.id) {
                // Relationship is already in list
                return;
            }
        }
        this.outputrels.push(relship);
    }
    setType(type: cxObjectType | cxRelationshipType) {
        this.type = type;
        this.typeRef = type.id;
        this.typeName = type.name;
    }
    getType(): cxObjectType | cxRelationshipType | null {
        return this.type;
    }
    setFromObject(obj: cxObject) {
        this.fromObject = obj;
    }
    getFromObject() {
        return this.fromObject;
    }
    setToObject(obj: cxObject) {
        this.toObject = obj;
    }
    getToObject() {
        return this.toObject;
    }
    setRelshipKind(kind: string) {
        this.relshipkind = kind;
    }
    getRelshipKind() {
        return this.relshipkind;
    }
    setViewKind(kind: string) {
        this.viewkind = kind;
    }
    getViewKind() {
        return this.viewkind;
    }
    getValueset() {
        return this.valueset;
    }
    getPropertyValues() {
        return this.getValueset();
        /*     
        // get type
        let type = this.getType();
        // get properties
        let props = type.getProperties(true);
        let propvalues = new Array();
        // for each property, get value
        let l = props.length;
        for (let i=0; i<l; i++) {
            let prop = props[i];
            if (utils.objExists(prop)) {
                let propname = prop.getName();
                propvalues[propname] = cxObj[propname];
            }         
        }
        */
    }
    addValue(value: cxPropertyValue) {
        // Check if input is of correct class and not already in list (TBD)
        if (value.constructor.name === "cxPropertyValue") {
            if (this.valueset == null)
                this.valueset = new Array();
            this.valueset.push(value);
        }
    }
    addStringValue(id: string, propname: string, strval: string, unit: cxUnit) {
        if (id === "name")
            this.setName(strval);
        else if (id === "description")
            this.setDescription(strval);
        else {
            const type = this.getType();
            if (type) {
                const prop = type.findProperty(id);
                if (prop) {
                    if (debug) console.log("Function 'addStringValue' not yet implemented!")
                    /*
                    let val = new cxValue(prop.id, "string", strval, unit);
                    if (this.getValueset() == null)
                        this.valueset = new Array();
                    this.valueset.push(val);
                    */
                }
            }
        }
    }
    isEkaRelationship() {
        let retval = false;
        if (this.viewkind === constants.VIEWKINDS.REL)
            retval = true;
        return retval;
    }
    setValue(propname: string, cxVal: cxValue) {  // Class cxPropertyValue
        // Check if input is of correct class and not already in list (TBD)
        if (cxVal.class === "cxPropertyValue") {
            // Find propname
            let i = 0;
            if (!this.valueset)
                this.valueset = new Array();
            while (i < this.valueset.length) {
                const v = this.valueset[i];
                if (v.getName() === propname) {
                    this.valueset[i] = cxVal;
                    break;
                }
                i++;
            }
        }
    }
    setStringValue(propname: string, strval: string) {
        let retval = false;
        // Find propname
        let v = null;
        let i = 0;
        if (!this.valueset) {
            this.valueset = new Array();
        }
        while (i < this.valueset.length) {
            v = this.valueset[i];
            if (v.getName() === propname) {
                v.value = strval;
                retval = true;
                break;
            }
            i++;
        }
        return retval;
    }
    setStringValue2(propname: string, value: any) {
        const inst: any = this;
        inst[propname] = value;
        return true;
    }
    getStringValue2(propname: string): string {
        const inst: any = this;
        const value = this[propname];
        if (debug) console.log('4510 inst', propname, value, this);
        return value;
    }
    findInputRelships(model: cxModel, rkind: string) {
        const rels = model.relships;
        if (!rels) return null;
        const relships = new Array();
        for (let i = 0; i < rels.length; i++) {
            const rel = rels[i];
            if (rel) {
                if (rel.deleted)
                    continue;
                const reltype = rel.type;
                if (reltype) {
                    const relkind = reltype.relshipkind;
                    if (rkind !== relkind)
                        continue;
                }
                let toObj = rel.toObject;
                if (toObj) {
                    if (toObj.id === this.id)
                        relships.push(rel);
                }
            }
        }
        return relships;
    }
    findOutputRelships(model: cxModel, rkind: string) {
        const rels = model.relships;
        if (!rels) return null;
        const relships = new Array();
        for (let i = 0; i < rels.length; i++) {
            const rel = rels[i];
            if (rel) {
                if (rel.deleted)
                    continue;
                const reltype = rel.type;
                if (reltype) {
                    const relkind = reltype.relshipkind;
                    if (rkind !== relkind)
                        continue;
                }
                let fromObj = rel.fromObject;
                if (fromObj) {
                    if (fromObj.id === this.id)
                        relships.push(rel);
                }
            }
        }
        return relships;
    }
    addJsonValue(item_key: string, item_value: cxValue) {
        if (!this.valueset)
            this.valueset = new Array();
        const allProps = this.allProperties;
        for (let i=0; i<allProps.length; i++) {
            const prop = allProps[i];
            if (prop && prop.id === item_key) {
                const val = new cxPropertyValue(prop, item_value);
                if (val) {
                    val.value = item_value;
                    this.valueset.push(val);
                }    
            }
        }
    }
}

export class cxObject extends cxInstance {
    objectviews: cxObjectView[] | null;
    viewFormat: string;
    inputPattern: string;
    constructor(id: string, name: string, type: cxObjectType | null, description: string) {
        super(id, name, type, description);
        this.class = 'cxObject';
        this.fs_collection = constants.fs.FS_C_OBJECTS;    // Firestore collection
        this.category = constants.gojs.C_OBJECT;
        this.objectviews = null;
        this.viewFormat = "";
        this.inputPattern = "";

        // Handle properties
        const props = this.type?.properties;
        for (let i=0; i<props?.length; i++) {
          const prop = props[i];
          this[prop.name] = "";
        } 
        if (debug) console.log('4600 obj', this);   
    }
    // Methods
    addObjectView(objview: cxObjectView) {
        if (!this.objectviews)
            this.objectviews = new Array();
        const len = this.objectviews.length;
        for (let i=0; i<len; i++) {
            const oview = this.objectviews[i];
            if (oview.id === objview.id) {
                // Object view is already in list
                return;
            }
        }
        this.objectviews.push(objview);
    }
    getObjectType(): cxObjectType | null {
        return this.type;
    }
    setViewFormat(fmt) {
        this.viewFormat = fmt;
    }
    getViewFormat() {
        return this.viewFormat;
    }
    setInputPattern(pattern) {
        this.inputPattern = pattern;
    }
    getInputPattern() {
        return this.inputPattern;
    }
}

export class cxRelationship extends cxInstance {
    fromobjectRef: string;
    toobjectRef: string;
    relshipviews: cxRelationshipView[] | null;
    constructor(id: string, type: cxRelationshipType | null, fromObj: cxObject | null, toObj: cxObject | null, name: string, description: string) {
        super(id, name, type, description);
        this.class = 'cxRelationship';
        this.fs_collection = constants.fs.FS_C_RELATIONSHIPS;  // Firestore collection
        this.category = constants.gojs.C_RELATIONSHIP;
        this.fromObject = fromObj;
        this.toObject = toObj;
        this.fromobjectRef = "";
        this.toobjectRef = "";
        if (!this.typeName) this.typeName = name;
    }
    // Methods
    addRelationshipView(relview: cxRelationshipView) {
        if (!this.relshipviews)
            this.relshipviews = new Array();
        const len = this.relshipviews.length;
        for (let i=0; i<len; i++) {
            const rview = this.relshipviews[i];
            if (rview.id === relview.id) {
                // Relati onshipview is already in list
                return;
            }
        }
        this.relshipviews.push(relview);
    }
    getRelationshipType() {
        return this.type;
    }
}

export class cxPropertyValue {
    property: cxProperty;
    value: cxValue;
    constructor(prop: cxProperty, value: cxValue) {
        this.property = prop;
        this.value = value;
    }
    // Methods
}

// ---------------------------------------------------------------------
export class cxValue extends cxMetaObject {
    value: string;
    constructor(id: string, name: string, description: string ) {
        super(id, name, description);
        this.value = this.name;
    }
    // Methods
}

export class cxViewFormat extends cxMetaObject {
    format: string;
    constructor(id: string, name: string, description: string ) {
        super(id, name, description);
        this.format = "%s";
    }
    // Methods
    getFormat() {
        return this.format;
    }
    setFormat(fmt: string) {
        // Todo: Check if valid format
        this.format = fmt;
    }
}

export class cxInputPattern extends cxMetaObject {
    pattern: string;
    constructor(id: string, name: string, description: string ) {
        super(id, name, description);
        this.pattern = "";
    }
    // Methods
    getPattern() {
        return this.pattern;
    }
    setPattern(pattern: string) {
        // Todo: Check if valid format
        this.pattern = pattern;
    }
}

// ---------------------------------------------------------------------
export class cxModelView extends cxMetaObject {
    model: cxModel | null;
    objecttypeviews: cxObjectTypeView[] | null;
    relshiptypeviews: cxRelationshipTypeView[] | null;
    objectviews: cxObjectView[] | null;
    relshipviews: cxRelationshipView[] | null;
    template: any;
    isTemplate: boolean;
    diagrams: cxDiagram[] | null;
    constructor(id: string, name: string, model: cxModel | null, description: string) {
        super(id, name, description);
        this.class = 'cxModelView';
        this.fs_collection = constants.fs.FS_C_MODELVIEWS;  // Firestore collection
        // this.category         = constants.gojs.C_MODELVIEW;    // This gives an error, why ??
        this.model = model;
        this.objecttypeviews = null;
        this.relshiptypeviews = null;
        this.objectviews = null;
        this.relshipviews = null;
        this.template = null;
        this.isTemplate = false;
        this.diagrams = null;
    }
    // Methods
    setModel(model: cxModel) {
        this.model = model;
    }
    getModel() {
        return this.model;
    }
    // Methods
    setTemplate(template: any) {
        this.template = template;
    }
    getTemplate() {
        return this.template;
    }
    setIsTemplate(flag: boolean) {
        this.isTemplate = flag;
    }
    getIsTemplate() {
        return this.isTemplate;
    }
    setObjectViews(objviews: cxObjectView[]) {
        this.objectviews = objviews;
    }
    getObjectViews() {
        return this.objectviews;
    }
    setObjectTypeViews(objecttypeviews: cxObjectTypeView[]) {
        this.objecttypeviews = objecttypeviews;
    }
    // getObjecTypetViews() { // sf removed t
    getObjecTypeViews() {
        return this.objecttypeviews;
    }
    setRelationshipViews(relviews: cxRelationshipView[]) {
        this.relshipviews = relviews;
    }
    getRelationshipViews() {
        return this.relshipviews;
    }
    setRelationshipTypeViews(relshiptypeviews: cxRelationshipTypeView[]) {
        this.relshiptypeviews = relshiptypeviews;
    }
    getRelationshipTypetViews() {
        return this.relshiptypeviews;
    }
    addObjectTypeView(objtypeView: cxObjectTypeView) {
        // Check if input is of correct class and not already in list (TBD)
        if (objtypeView.class === "cxObjectTypeView") {
            if (this.objecttypeviews == null)
                this.objecttypeviews = new Array();
            this.objecttypeviews.push(objtypeView);
        }
    }
    addRelationshipTypeView(reltypeView: cxRelationshipTypeView) {
        // Check if input is of correct class and not already in list (TBD)
        if (reltypeView.class === "cxRelationshipTypeView") {
            if (this.relshiptypeviews == null)
                this.relshiptypeviews = new Array();
            this.relshiptypeviews.push(reltypeView);
        }
    }
    addObjectView(objview: cxObjectView) {
        // Check if input is of correct class and not already in list (TBD)
        if (objview.class === "cxObjectView") {
            if (this.objectviews == null)
                this.objectviews = new Array();
            if (!this.findObjectView(objview.id))
                this.objectviews.push(objview);
        }
    }
    addRelationshipView(relshipview: cxRelationshipView) {
        // Check if input is of correct class and not already in list (TBD)
        if (relshipview.class === "cxRelationshipView") {
            if (this.relshipviews == null)
                this.relshipviews = new Array();
            if (!this.findRelationshipView(relshipview.id))
                this.relshipviews.push(relshipview);
        }
    }
    findObjectView(id: string) {
        if (!this.objectviews) return null;
        let i = 0;
        let obj = null;
        while (i < this.objectviews.length) {
            obj = this.objectviews[i];
            if (obj) {
                if (obj.id === id)
                    return obj;
                else if (obj.getFirestoreId() === id)
                    return obj;
            }
            i++;
        }
    }
    findObjectViewByName(name: string) {
        if (!this.objectviews) return null;
        let i = 0;
        let obj = null;
        while (i < this.objectviews.length) {
            obj = this.objectviews[i];
            if (obj.name === name)
                return obj;
            i++;
        }
    }
    findObjectTypeView(id: string) {
        if (!this.objecttypeviews) return null;
        let i = 0;
        let obj = null;
        while (i < this.objecttypeviews.length) {
            obj = this.objecttypeviews[i];
            if (obj) {
                if (obj.id === id)
                    return obj;
                else if (obj.getFirestoreId() === id)
                    return obj;
            }
            i++;
        }
    }
    findRelationshipView(id: string) {
        let relshipviews = this.relshipviews;
        if (!relshipviews) return null;
        let i = 0;
        let obj = null;
        while (i < relshipviews.length) {
            obj = relshipviews[i];
            if (obj) {
                if (obj.id === id)
                    return obj;
                else if (obj.getFirestoreId() === id)
                    return obj;
            }
            i++;
        }
    }
    findRelationshipTypeView(id: string) {
        if (!this.relshiptypeviews) return null;
        let i = 0;
        let obj = null;
        while (i < this.relshiptypeviews.length) {
            obj = this.relshiptypeviews[i];
            if (obj) {
                if (obj.id === id)
                    return obj;
                else if (obj.getFirestoreId() === id)
                    return obj;
            }
            i++;
        }
    }
}

export class cxObjectView extends cxMetaObject {
    category: string;
    fs_collection: string;
    object: cxObject | null;
    objectRef: string;
    typeview: cxObjectTypeView | null;
    typeviewRef: string;
    icon: string;
    group: string;
    isGroup: boolean;
    groupLayout: string;
    parent: string;
    isCollapsed: boolean;
    visible: boolean;
    loc: string;
    size: string;
    constructor(id: string, name: string, object: cxObject | null, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_OBJECTVIEWS;  // Firestore collection
        this.class = 'cxObjectView';
        this.category = constants.gojs.C_OBJECTVIEW;
        this.object = object;
        this.objectRef = "";
        this.typeview = null;              // Override default type view
        this.typeviewRef = "";
        this.icon = "";
        this.group = "";
        this.isGroup = false;
        this.groupLayout = "";
        this.parent = "";
        this.isCollapsed = false;
        this.visible = true;
        this.loc = "";
        this.size = "";
    }
    // Methods
    setObject(object: cxObject) {
        if (utils.objExists(object)) {
            this.object = object;
        }
    }
    getObject() {
        return this.object;
    }
    getObjectType() {
        const obj = this.getObject();
        if (obj) {
            return obj.getType();
        }
    }
    setTypeView(typeview: cxObjectTypeView) {
        this.typeview = typeview;
    }
    getTypeView() {
        return this.typeview;
    }
    getDefaultTypeView() {
        const obj = this.getObject();
        if (obj) {
            const objtype = obj.getType();
            if (objtype) {
                return objtype.getDefaultTypeView();
            }
        }
        return null;
    }
    setIcon(icon: string) {
        this.icon = icon;
    }
    getIcon() {
        if (this.icon)
            return this.icon;
        return "";
    }
    setIsGroup(flag: boolean) {
        this.isGroup = flag;
    }
    getIsGroup() {
        if (utils.objExists(this.isGroup))
            return this.isGroup;
        return "";
    }
    setGroup(group: string) {
        this.group = group;
    }
    getGroup() {
        if (utils.objExists(this.group))
            return this.group;
        return "";
    }
    setGroupLayout(groupLayout: string) {
        this.groupLayout = groupLayout;
    }
    getGroupLayout() {
        if (utils.objExists(this.groupLayout))
            return this.groupLayout;
        return "";
    }
    // To be done ??
    getGroupMembers(modelView: cxModelView) {
        const members = new Array();
        if (this.isGroup) {
            const groupId = this.id;
            const objviews = modelView.getObjectViews();
            for (let i=0; i<objviews?.length; i++) {
                const objview = objviews[i];
                if (objview.group === groupId) {
                    members.push(objview);
                }
            }
        }
        return members;
    }
    setParent(parent: string) {
        this.parent = parent;
    }
    getParent() {
        if (utils.objExists(this.parent))
            return this.parent;
        return "";
    }
    setSize(size: string) {
        if (size == undefined)
            size = "";
        this.size = size;
    }
    getSize() {
        if (this.size == undefined)
            return "";
        return this.size;
    }
    setLoc(loc: string) {
        this.loc = loc;
    }
    getLoc() {
        if (utils.objExists(this.loc))
            return this.loc;
        return "";
    }
}

export class cxRelationshipView extends cxMetaObject {
    category: string;
    fs_collection: string;
    relship: cxRelationship | null;
    relshipRef: string;
    typeview: cxRelationshipTypeView | null;
    typeviewRef: string;
    fromObjview: cxObjectView | null;
    fromObjviewRef: string;
    toObjview: cxObjectView | null;
    toObjviewRef: string;
    constructor(id: string, name: string, relship: cxRelationship | null, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_RELSHIPVIEWS;  // Firestore collection
        this.class = 'cxRelationshipView';
        this.category = constants.gojs.C_RELSHIPVIEW;
        this.relship = relship;
        this.typeview = null;                 // Override default type view
        this.fromObjview = null;
        this.toObjview = null;
        this.relshipRef = "";
        this.typeviewRef = "";                 // Override default type view
        this.fromObjviewRef = "";
        this.toObjviewRef = "";
    }
    // Methods
    getRelationship() {
        return this.relship;
    }
    setRelationship(rel: cxRelationship) {
        if (rel) this.relship = rel;
    }
    setTypeView(typeview: cxRelationshipTypeView) {
        if (typeview) this.typeview = typeview;
    }
    getTypeView() {
        return this.typeview;
    }
    setFromObjectView(objview: cxObjectView) {
        if (utils.objExists(objview)) {
            this.fromObjview = objview;
        }
    }
    getFromObjectView() {
        return this.fromObjview;
    }
    setToObjectView(objview: cxObjectView) {
        if (utils.objExists(objview)) {
            this.toObjview = objview;
        }
    }
    getToObjectView() {
        return this.toObjview;
    }
}

export class cxDiagram extends cxMetaObject {
    modelview: cxModelView;
    content: any;
    constructor(id: string, name: string, modelview: cxModelView, description: string) {
        super(id, name, description);
        this.modelview = modelview;
        this.content = null;
    }
    // Methods
    setModelView(modelview: cxModelView) {
        this.modelview = modelview;
    }
    getModelView() {
        return this.modelview;
    }
    setContent(jsonContent: any) {
        this.content = jsonContent;
    }
    getContent() {
        return this.content;
    }
}

// ---------------------------------------------------------------------

export class cxIdent {
    id: string;
    name: string;
    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}

/*
module.exports = {
	cxMetis 				: cxMetis,
	cxMetaObject 			: cxMetaObject,
	cxDatatype 				: cxDatatype,
	cxMetaModel 			: cxMetaModel,
	cxObjectType 			: cxObjectType,
	cxRelationshipType 		: cxRelationshipType,
	cxProperty 				: cxProperty,
	cxObjectTypeView 		: cxObjectTypeView,
	cxRelationshipTypeView	: cxRelationshipTypeView,
	cxModel 				: cxModel,
	cxObject 				: cxObject,
	cxRelationship 			: cxRelationship,
	cxbject 			: cxbject,
	cxEkaRelationship 		: cxEkaRelationship,
	cxPropertyValue 		: cxPropertyValue,
	cxValue 				: cxValue,
	cxModelView 			: cxModelView,
	cxObjectView 			: cxObjectView,
	cxRelationshipView 		: cxRelationshipView,
	cxIdent 				: cxIdent
}
*/

//export default cxMetis;