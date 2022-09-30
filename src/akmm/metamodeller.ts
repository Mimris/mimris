// @ts- nocheck
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
import * as ui_mtd from './ui_methods';
const utils = require('./utilities');
//const glb 	    = require('./akm_globals');
const constants = require('./constants');

import * as gjs from './ui_gojs';
import akmmGraphql from '../pages/akmm-graphql';
import { setMyMetisParameter } from '../actions/actions';

// cxMetis

export class cxMetis {
    id:                 string;
    name:               string;
    description:        string;
    category:           string;
    projects:           cxProject[] | null;
    metamodels:         cxMetaModel[] | null = null;
    viewstyles:         cxViewStyle[] | null;
    geometries:         cxGeometry[] | null;
    models:             cxModel[] | null = null;
    modelviews:         cxModelView[] | null = null;
    datatypes:          cxDatatype[] | null = null;
    inputpatterns:      cxInputPattern[] | null = null;
    viewformats:        cxViewFormat[] | null = null;
    fieldTypes:         cxFieldType[] | null = null;
    enumerations:       cxEnumeration[] | null = null;
    units:              cxUnit[] | null = null;
    categories:         cxUnitCategory[] | null = null;
    properties:         cxProperty[] | null = null;
    methods:            cxMethod[] | null = null;
    methodtypes:        cxMethodType[] | null = null;
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
    currentProject:     cxProject | null = null;
    currentMetamodel:   cxMetaModel | null = null;
    currentMetamodelRef: string | null = null;
    currentModel:       cxModel | null = null;
    currentModelRef:    string | null = null;
    currentModelview:   cxModelView | null = null;
    currentModelviewRef: string | null = null;
    currentTargetMetamodel:     cxMetaModel | null = null;
    currentTargetModel:         cxModel | null = null;
    currentTargetModelview:     cxModelView | null = null;
    currentTargetMetamodelRef:  string;
    currentTargetModelRef:      string;
    currentTargetModelviewRef:  string;
    currentTemplateMetamodel:   cxMetaModel | null = null;
    currentTemplateModel:       cxModel | null = null;
    currentTemplateModelview:   cxModelView | null = null;
    currentTaskModel:           cxModel | null = null;
    currentTaskModelRef:        string;
    currentNode:        any;
    currentLink:        any;
    myDiagram:          any;
    selectedData:       any = null;
    pasteViewsOnly:     boolean = false;
    deleteViewsOnly:    boolean = false;
    pasted:             boolean = false;
    modelType:          string = "";
    adminModel:         cxModel;
    showAdminModel:     boolean;
    dispatch:           any;
    fromNodes:          any;
    currentSelection:   any;
    // Constructor
    constructor() {
        this.id = utils.createGuid();
        this.name = "";
        this.description = "";
        this.viewstyles = [];
        this.geometries = [];
        this.category = 'Metis';
        this.fromNodes = [];
    }
    importData(importedData: any, includeDeleted: boolean) {
        if (debug) console.log('79 importedData', importedData);
        this.name        = importedData.name;
        this.description = importedData.description
        this.initImport(importedData, includeDeleted);
        if (debug) console.log('83 this', this);
        // Handle projects
        const projects = (importedData) && importedData.projects;
        if (projects && projects.length) {
            for (let i = 0; i < projects.length; i++) {
                const project = projects[i];
                if (project) this.importProject(project);
                if (debug) console.log('90 importData', this);
            }
        }
        if (debug) console.log('93 Imported project', this);

        // Handle metamodels
        const metamodels = (importedData) && importedData.metamodels;
        if (metamodels && metamodels.length) {
            for (let i = 0; i < metamodels.length; i++) {
                const metamodel = metamodels[i];
                if (metamodel) 
                    this.importMetamodel(metamodel);
                // this.addMetamodel(metamodel);
                if (debug) console.log('121 metamodel', metamodel, this);
            }
        }
        if (debug) console.log('124 relshiptypes', this.relshiptypes);
        if (debug) console.log('125relshiptypeviews', this.relshiptypeviews);
        if (debug) console.log('126 Imported metamodel', this);

        // Handle viewstyles
        const viewstyles: any[] = (importedData) && importedData.viewstyles;
        if (viewstyles && viewstyles.length) {
            viewstyles.forEach(vstyle => {
                if (vstyle && !vstyle.markedAsDeleted) {
                    this.importViewStyle(vstyle, null);
                }
            })
        }

        // Handle geometries
        const geometries: any[] = (importedData) && importedData.geometries;
        if (geometries && geometries.length) {
            geometries.forEach(geo => {
                if (geo && !geo.markedAsDeleted) {
                    this.importGeometry(geo, null);
                }
            })
        }

        // Handle models next
        const models: any[] = (importedData) && importedData.models;
        if (models && models.length) {
            models.forEach(model => {
                if (model && !model.markedAsDeleted) {
                    this.importModel(model);
                }
            })
        }
        
        // Handle objects 
        const objects: any[] = (importedData) && importedData.objects;
        if (objects && objects.length) {
            objects.forEach(obj => {
                if (obj && !obj.markedAsDeleted)
                this.importObject(obj, null);
            })
        }

        // Handle relships 
        const relships: any[] = (importedData) && importedData.relships;
        if (relships && relships.length) {
            relships.forEach(rel => {
                if (rel && !rel.markedAsDeleted)
                this.importRelship(rel, null);
            })
        }
        if (debug) console.log('174 relshiptypes', this.relshiptypes);
        // Handle current variables
        if (importedData.currentProjectRef) {
            const project = this.findProject(importedData.currentProjectRef);
            if (project)
                this.currentProject = project;
        }
        if (importedData.currentMetamodelRef) {
            const metamodel = this.findMetamodel(importedData.currentMetamodelRef);
            if (metamodel) {
                this.currentMetamodel = metamodel;
                this.currentMetamodelRef = metamodel.id;
            }
        }
        if (importedData.currentModelRef) {
            const model = this.findModel(importedData.currentModelRef);
            if (model) {
                this.currentModel = model;
                this.currentModelRef = model.id;
            }
        }
        if (importedData.currentModelviewRef) {
            const modelview = this.findModelView(importedData.currentModelviewRef);
            if (modelview) {
                this.currentModelview = modelview;
                this.currentModelviewRef = modelview.id;
            }
        }
        if (importedData.currentTemplateModelRef) {
            const model = this.findModel(importedData.currentTemplateModelRef);
            if (model)
                this.setCurrentTemplateModel(model);
        }
        if (importedData.currentTargetMetamodelRef) {
            const metamodel = this.findMetamodel(importedData.currentTargetMetamodelRef);
            if (metamodel)
                this.setCurrentTargetMetamodel(metamodel);
        }
        if (importedData.currentTargetModelRef) {
            const model = this.findModel(importedData.currentTargetModelRef);
            if (model)
                this.setCurrentTargetModel(model);
        }
        if (importedData.currentModelviewRef) {
            const modelview = this.findModelView(importedData.currentTargetModelviewRef);
            if (modelview)
                this.currentTargetModelview = modelview;
        }
        if (importedData.currentTaskModelRef) {
            const model = this.findModel(importedData.currentTaskModelRef);
            if (model) 
                this.setCurrentTaskModel(model);
        }
        if (debug) console.log('211 this', this);

        // Postprocess objecttypes
        const objtypes = this.objecttypes;
        for (let i=0; i<objtypes.length; i++) {
            const otype = objtypes[i];
            const stypes = otype.findSupertypes(0);
            for (let j=0; j<stypes?.length; j++) {
                const stype = stypes[j];
                otype.addSupertype(stype);
            }
            if (debug) console.log('184 otype, stypes', otype, stypes);
        }
        if (debug) console.log('224 this', this);
    }
    initImport(importedData: any, includeDeleted: boolean) {
        // Import metamodels
        if (debug) console.log('190 importedData', importedData);
        const metamodels = (importedData) && importedData.metamodels;
        if (metamodels && metamodels.length) {
            for (let i = 0; i < metamodels.length; i++) {
                const item = metamodels[i];
                if (includeDeleted || !item.markedAsDeleted) { 
                    const metamodel = (item) && new cxMetaModel(item.id, item.name, item.description);
                    metamodel.markedAsDeleted = item.markedAsDeleted;
                    metamodel.layout = item.layout;
                    metamodel.routing = item.routing;
                    metamodel.linkcurve = item.linkcurve;
                    metamodel.generatedFromModelRef = item.generatedFromModelRef;
                    metamodel.includeInheritedReltypes = item.includeInheritedReltypes;
                    if (!metamodel) continue;
                    this.addMetamodel(metamodel);
                    if (debug) console.log('198 item, metamodel', item, metamodel);
                    // Metamodel content
                    let items = item.datatypes;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.markedAsDeleted) { 
                                const dtype = new cxDatatype(item.id, item.name, item.description);
                                metamodel.addDatatype(dtype);
                                this.addDatatype(dtype);
                            }
                        }
                    }
                    items = item.methodtypes;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.markedAsDeleted) { 
                                const mtype = new cxMethodType(item.id, item.name, item.description);
                                metamodel.addMethodType(mtype);
                                this.addMethodType(mtype);
                            }
                        }
                    }
                    items = item.properties;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.markedAsDeleted) { 
                                const prop = new cxProperty(item.id, item.name, item.description);
                                if (!prop) continue;
                                metamodel.addProperty(prop);
                                this.addProperty(prop);
                            }
                        }
                    }
                    items = item.methods;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.markedAsDeleted) { 
                                const mtd = new cxMethod(item.id, item.name, item.description);
                                if (!mtd) continue;
                                mtd.methodtype = item.methodtype;
                                mtd.expression = item.expression;
                                metamodel.addMethod(mtd);
                                this.addMethod(mtd);
                            }
                        }
                    }
                    if (debug) console.log('240 this', this);
                    items = item.objecttypes;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.markedAsDeleted) { 
                                const otype = new cxObjectType(item.id, item.name, item.description);
                                if (!otype) continue;
                                metamodel.addObjectType(otype);
                               this.addObjectType(otype);
                                if (debug) console.log('183 otype', otype);
                            }
                        }
                    }
                    items = item.objtypegeos;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.markedAsDeleted) { 
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
                            if (includeDeleted || !item.markedAsDeleted) { 
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
                            if (includeDeleted || !item.markedAsDeleted) { 
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
                            if (includeDeleted || !item.markedAsDeleted) { 
                                const rtv = new cxRelationshipTypeView(item.id, item.name, null, item.description);
                                if (!rtv) continue;
                                metamodel.addRelationshipTypeView(rtv);
                                this.addRelationshipTypeView(rtv);
                            }
                        }
                    }
                    items = item.viewstyles;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.markedAsDeleted) { 
                                const viewstyle = new cxViewStyle(item.id, item.name, item.description);
                                if (!viewstyle) continue;
                                metamodel.addViewStyle(viewstyle);
                                this.addViewStyle(viewstyle);
                            }
                        }
                    }
                    items = item.geometries;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.markedAsDeleted) { 
                                const geo = new cxGeometry(item.id, item.name, item.description);
                                if (!geo) continue;
                                metamodel.addGeometry(geo);
                                this.addGeometry(geo);
                            }
                        }
                    }
                }
            }
        }
        if (debug) console.log('284 this', this);
        // Import models
        const models = (importedData) && importedData.models;
        if (models && models.length) {
            for (let i = 0; i < models.length; i++) {
                const item = models[i];
                const model = new cxModel(item.id, item.name, null, item.description);
                this.addModel(model);
                let items = (importedData) && importedData.models;
                if (items && items.length) {
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        if (includeDeleted || !item.markedAsDeleted) { 
                            const model = new cxModel(item.id, item.name, null, item.description);
                            if (!model) continue;
                            this.addModel(model);
                            
                            // Objects and relationships
                            let objs = item.objects;
                            if (objs && objs.length) {
                                for (let i = 0; i < objs.length; i++) {
                                    const item = objs[i];
                                    if (includeDeleted || !item.markedAsDeleted) { 
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
                                    if (includeDeleted || !item.markedAsDeleted) { 
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
                                    if (includeDeleted || !item.markedAsDeleted) { 
                                        if (debug) console.log('237 initImport', item);
                                        const mv = new cxModelView(item.id, item.name, null, item.description);
                                        if (!mv) continue;
                                        mv.layout = item.layout;
                                        mv.routing = item.routing;
                                        mv.linkcurve = item.linkcurve;
                                        mv.showCardinality = item.showCardinality;
                                        mv.askForRelshipName = item.askForRelshipName;
                                        mv.includeInheritedReltypes = item.includeInheritedReltypes;
                                        model.addModelView(mv);
                                        this.addModelView(mv);
                                        mv.setModel(model);
                                        // Object views and relationship views
                                        let views = item.objectviews;
                                        if (views && views.length) {
                                            for (let i = 0; i < views.length; i++) {
                                                const item = views[i];
                                                if (includeDeleted || !item.markedAsDeleted) { 
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
                                                if (includeDeleted || !item.markedAsDeleted) { 
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
    importProject(item: any) {
        let projectref = item.id;
        let project = this.findProject(projectref);
        if (debug) console.log('360 item', item);
        if (project) {
            for (const prop in item) {
                project[prop] = item[prop];
            }
            if (debug) console.log('365 project', project);
        }
    }
    importViewStyle(item: any, parent: cxMetaModel) {
        const vstyle = this.findViewStyle(item.id);
        if (debug) console.log('392 item', item);
        if (!vstyle) 
            return;
        let objecttypeviews: any[] = item.objecttypeviews;
        if (objecttypeviews && objecttypeviews.length) {
            objecttypeviews.forEach(objtypeview => {
                if (objtypeview) 
                    this.importObjectTypeView(objtypeview, vstyle);
            });
        }
        if (debug) console.log('402 this', this);
        let relshiptypeviews = item.relshiptypeviews;
        if (relshiptypeviews && relshiptypeviews.length) {
            relshiptypeviews.forEach(reltypeview => {
                if (reltypeview)
                    this.importRelshipTypeView(reltypeview, vstyle);
            });
        }
        this.addViewStyle(vstyle);
        if (parent) parent.addViewStyle(vstyle);
        if (debug) console.log('412 viewstyle', vstyle);
    }
    importGeometry(item: any, parent: cxMetaModel) {
        const geo = this.findGeometry(item.id);
        if (debug) console.log('491 item', item);
        if (!geo) 
            return;
        this.addGeometry(geo);
        if (parent) parent.addGeometry(geo);
        if (debug) console.log('496 geometry', geo);
    }
    importMetamodel(item: any) {
        const metamodel = this.findMetamodel(item.id);
        if (!metamodel) 
            return;
        metamodel.includeInheritedReltypes = item.includeInheritedReltypes;
        let submetamodelRefs = item.metamodelRefs;
        if (submetamodelRefs && submetamodelRefs.length) {
            submetamodelRefs.forEach(submetamodelRef => {
                if (submetamodelRef) {
                    const submetamodel = this.findMetamodel(submetamodelRef);
                    if (submetamodel) {
                        metamodel.addMetamodel(submetamodel);
                    }
                }
            });
        }
        let datatypes: any[] = item.datatypes;
        if (datatypes && datatypes.length) {
            datatypes.forEach(datatype => {
                if (datatype)
                    this.importDatatype(datatype, metamodel);
            });
        }
        let mtdtypes: any[] = item.methodtypes;
        if (mtdtypes && mtdtypes.length) {
            mtdtypes.forEach(mtdtype => {
                if (mtdtype)
                    this.importMethodType(mtdtype, metamodel);
            });
        }
        let methods: any[] = item.methods;
        if (methods && methods.length) {
            methods.forEach(mtd => {
                if (mtd)
                    this.importMethod(mtd, metamodel);
            });
        }
        let vstyles: any[] = item.viewstyles;
        if (vstyles && vstyles.length) {
            vstyles.forEach(vs => {
                if (vs)
                    this.importViewStyle(vs, metamodel);
            });
        }
        let geos: any[] = item.geometries;
        if (geos && geos.length) {
            geos.forEach(geo => {
                if (geo)
                    this.importGeometry(geo, metamodel);
            });
        }
        if (debug) console.log('343 this', this);
        let objecttypes: any[] = item.objecttypes;
        if (objecttypes && objecttypes.length) {
            objecttypes.forEach(objtype => {
                if (objtype) {
                    this.importObjectType(objtype, metamodel);
                    const otype = this.findObjectType(objtype.id);
                    otype.removeDuplicateProperties();
                    // Fix method references
                    const mtds = otype.methods;
                    mtds.forEach(mtd => {
                        const method = this.findMethod(mtd.id);
                        otype.addMethod(method);
                    })
                }
            });
        }
        let objecttypes0: any[] = item.objecttypes0;
        if (objecttypes0 && objecttypes0.length) {
            objecttypes0.forEach(objtype0 => {
                if (objtype0) {
                    let objtype = this.findObjectType(objtype0.id);
                    if (!objtype) {
                        this.addObjectType(objtype0);
                    }
                    metamodel.addObjectType0(objtype);
                }
            });
        }
        if (debug) console.log('351 this', this);
        let objtypegeos: any[] = item.objtypegeos;
        if (objtypegeos && objtypegeos.length) {
            objtypegeos.forEach(objtypegeo => {
                if (objtypegeo) 
                    this.importObjectTypegeo(objtypegeo, metamodel);
            });
        }
        if (debug) console.log('359 this', this);
        let objecttypeviews: any[] = item.objecttypeviews;
        if (objecttypeviews && objecttypeviews.length) {
            objecttypeviews.forEach(objtypeview => {
                if (objtypeview) 
                    this.importObjectTypeView(objtypeview, metamodel);
            });
        }

        let relshiptypes: any[] = item.relshiptypes;
        if (debug) console.log('361 relshiptypes', relshiptypes);
        if (relshiptypes && relshiptypes.length) {
            relshiptypes.forEach(reltype => {
                if (debug) console.log('371 reltype', reltype);
                if (reltype) {
                    this.importRelshipType(reltype, metamodel);
                    const reltypes = metamodel.relshiptypes;
                    if (debug) console.log('376 reltypes', reltypes); 
                    reltypes.forEach(rtype => {
                        if (rtype.id === reltype.id) {
                            rtype.fromObjtype = reltype.fromObjtype;
                            rtype.fromobjtypeRef = reltype.fromobjtypeRef;
                            rtype.toObjtype = reltype.toObjtype;
                            rtype.toobjtypeRef = reltype.toobjtypeRef;
                            rtype.relshipkind = reltype.relshipkind;
                            rtype.removeDuplicateProperties();
                            if (debug) console.log('379 rtype', rtype);
                        }
                    })
                }
            });
        }
        let relshiptypes0: any[] = item.relshiptypes0;
        if (debug) console.log('361 relshiptypes0', relshiptypes0);
        if (relshiptypes0 && relshiptypes0.length) {
            relshiptypes0.forEach(reltype0 => {
                if (debug) console.log('371 reltype0', reltype0);
                if (reltype0) {
                    let reltype = this.findRelationshipType(reltype0.id);
                    if (!reltype) {
                        this.addRelationshipType(reltype0);
                    }
                    metamodel.addRelationshipType0(reltype);
                }
            });
        }
        if (debug) console.log('658 metamodel', metamodel);
        let relshiptypeviews = item.relshiptypeviews;
        if (relshiptypeviews && relshiptypeviews.length) {
            relshiptypeviews.forEach(reltypeview => {
                if (reltypeview)
                    this.importRelshipTypeView(reltypeview, metamodel);
            });
        }        
        if (debug) console.log('644 metamodel', metamodel);
    }
    importDatatype(item: any, metamodel: cxMetaModel) {
        let dtyperef = item.id;
        let datatype = this.findDatatype(dtyperef);
        if (debug) console.log('412 item', item);
        if (datatype) {
            for (const prop in item) {
                datatype[prop] = item[prop];
            }
            if (debug) console.log('417 datatype', datatype);
            metamodel.addDatatype(datatype);
        }
    }
    importObjectType(item: any, metamodel: cxMetaModel) {
        let objtype = this.findObjectType(item.id);
        if (!objtype) {
            objtype = new cxObjectType(item.id, item.name, item.description);
        }
        if (objtype) {
            if (debug) console.log('637 item, objtype', item, objtype);
            objtype.markedAsDeleted = item.markedAsDeleted;
            let otype = (objtype as cxObjectType);
            for (const prop in item) {
                otype[prop] = item[prop];
            }
            objtype = otype;
            if (debug) console.log('645 item, otype, objtype', item, otype, objtype);
            if (item.typeviewRef) {
                const objtypeview = this.findObjectTypeView(item.typeviewRef);
                if (objtype && objtypeview)
                    objtype.setDefaultTypeView(objtypeview);
                if (objtypeview) { 
                    metamodel.addObjectTypeView(objtypeview);
                }
                if (debug) console.log('425 objtype, objtypeview', objtype, objtypeview, metamodel);
            }
            if (objtype) {
                metamodel.addObjectType(objtype);
                this.addObjectType(objtype);
            }
            const properties: any[] = item.properties;
            if (properties && properties.length) {
                properties.forEach(p => {
                    const prop = p as cxProperty;
                    if (prop) this.importProperty(prop, metamodel);
                })
            }

            objtype.attributes = [];
            const props = objtype.properties;
            if (props && props.length) {
                props.forEach(p => {
                    const prop = p as cxProperty;
                    let attr = objtype.findAttributeByProperty(prop.id);
                    if (!attr) {
                        attr = new cxAttribute(objtype, prop);
                        objtype.addAttribute(attr);
                    }
                })
            }

            const methods: any[] = item.methods;
            if (methods && methods.length) {
                methods.forEach(m => {
                    const mtd = m as cxMethod;
                    if (mtd) this.importMethod(mtd, metamodel);
                })
            }
        }
    }
    importRelshipType(item: any, metamodel: cxMetaModel) {
        let reltype = this.findRelationshipType(item.id);
        // objtypes registered in metamodel
        let fromobjtype = metamodel.findObjectType(item.fromobjtypeRef);
        let toobjtype = metamodel.findObjectType(item.toobjtypeRef);
        if (debug) console.log('447 reltype, fromtype, totype: ', reltype, fromobjtype, toobjtype);
        if (!reltype) {
            if (fromobjtype && toobjtype)
                reltype = new cxRelationshipType(item.id, item.name, fromobjtype, toobjtype, item.description);
                metamodel.addRelationshipType(reltype);
                fromobjtype.addOutputreltype(reltype);
                toobjtype.addInputreltype(reltype);
        }
        if (debug) console.log('453 reltype', reltype);
        if (reltype) {
            reltype.markedAsDeleted = item.markedAsDeleted;
            let rtype = (reltype as any);
            for (const prop in rtype) {
                if (item[prop])
                    rtype[prop] = item[prop];
            }
            if (item.fromobjtypeRef && item.toobjtypeRef) {
                const fromobjType = this.findObjectType(item.fromobjtypeRef);
                const toobjType = this.findObjectType(item.toobjtypeRef);

                if (reltype && fromobjType) {
                        reltype.setFromObjtype(fromobjType);
                        fromobjType.addOutputreltype(reltype);
                }
                if (reltype && toobjType) {
                    reltype.setToObjtype(toobjType);
                    toobjType.addInputreltype(reltype);
                }
                if (reltype && item.typeviewRef) {
                    const reltypeview = this.findRelationshipTypeView(item.typeviewRef);
                    if (reltypeview)
                        reltype.setDefaultTypeView(reltypeview);
                    else {
                        const id = item.typeviewRef;
                        const reltypeview = new cxRelationshipTypeView(id, id, reltype, "");
                        this.addRelationshipTypeView(reltypeview);
                        metamodel.addRelationshipTypeView(reltypeview);
                        reltype.typeview = reltypeview;    
                    }
                }
                if (debug) console.log('472 item, reltype', item, reltype);
                if (debug) console.log("Importing relshiptype: " + item.id + ", " + item.name);
                // Import properties
                const properties: any[] = item.properties;
                if (properties && properties.length) {
                    properties.forEach(p => {
                        const prop = p as cxProperty;
                        if (prop) this.importProperty(prop, metamodel);
                    });
                }
            }
            if (debug) console.log('485 reltype', reltype, metamodel, this);
        }
    }
    importObjectTypeView(item: any, parent: cxMetaModel | cxViewStyle) {
        const objtypeview = this.findObjectTypeView(item.id);
        const typeref = item.typeRef;
        const type = this.findObjectType(typeref);
        if (!item.template) item.template = "";
        if (!item.geometry) item.geometry = "";
        if (objtypeview && type) {
            objtypeview.setMarkedAsDeleted(item.markedAsDeleted);
            objtypeview.setStrokewidth(item.strokewidth);
            objtypeview.setType(type);
            objtypeview.setTemplate(item.template);
            objtypeview.setViewKind(item.viewkind);
            objtypeview.setMemberscale(item.memberscale);
            objtypeview.setGeometry(item.geometry);
            objtypeview.setFigure(item.figure);
            objtypeview.setFillcolor(item.fillcolor);
            objtypeview.setFillcolor2(item.fillcolor2);
            objtypeview.setTextcolor(item.textcolor);
            objtypeview.setTextscale(item.textscale);
            objtypeview.setStrokecolor(item.strokecolor);
            objtypeview.setStrokecolor2(item.strokecolor2);
            objtypeview.setStrokewidth(item.strokewidth);
            objtypeview.setIcon(item.icon);
            // objtypeview.setGroup(item.group);
            // objtypeview.setIsGroup(item.isGroup);
            if (debug) console.log('222 objtypeview', objtypeview, item);
            parent.addObjectTypeView(objtypeview);
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
    importRelshipTypeView(item: any, parent: cxMetaModel | cxViewStyle) {
        const reltypeview = this.findRelationshipTypeView(item.id);
        const typeref = item.typeRef;
        const type = this.findRelationshipType(typeref);
        if (!item.template) item.template = "";
        if (reltypeview && type) {
            reltypeview.setMarkedAsDeleted(item.markedAsDeleted);
            reltypeview.setType(type);
            reltypeview.setTemplate(item.template);
            reltypeview.setStrokecolor(item.strokecolor);
            reltypeview.setTextcolor(item.textcolor);
            reltypeview.setStrokewidth(item.strokewidth);
            reltypeview.setDash(item.dash);
            reltypeview.setFromArrow(item.fromArrow);
            reltypeview.setToArrow(item.toArrow);
            reltypeview.setFromArrowColor(item.fromArrowColor);
            reltypeview.setToArrowColor(item.toArrowColor);
            parent.addRelationshipTypeView(reltypeview);
            if (debug) console.log("Importing reltypeview: " + item.id + ", " + item.name);
            type.setDefaultTypeView(reltypeview);
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
        }
    }
    importMethodType(item: any, metamodel: cxMetaModel) {
        if (debug) console.log('720 item', item);
        let mtype = this.findMethodType(item.id);
        if (mtype) {
            for (const prop in item) {
                if (item[prop]) {
                    let mtd = (mtype as any);
                    mtd[prop] = item[prop];
                }
            }
            metamodel.addMethodType(mtype);
        }
    }
    importMethod(item: any, metamodel: cxMetaModel) {
        let method = this.findMethod(item.id);
        if (method) {
            for (const prop in item) {
                if (item[prop]) {
                    let mtd = (method as any);
                    mtd[prop] = item[prop];
                }
            }
            metamodel.addMethod(method);
        }
    }
    importModel(item: any) {
        const model = this.findModel(item.id);
        if (model) {
            const metamodel = this.findMetamodel(item.metamodelRef);
            if (metamodel) {
                model.setMetamodel(metamodel);
                const objects: any[] = item.objects;
                if (debug) console.log('833 model', model);
                if (objects && objects.length) {
                    objects.forEach(object => {
                        if (model) this.importObject(object, model);
                    });
                }
                const relships: any[] = item.relships;
                if (debug) console.log('845 relships', relships);
                if (relships && (relships.length > 0)) {
                    relships.forEach(rel => {
                        if (model) this.importRelship(rel, model);
                    });
                }
                const modelviews: any[] = item.modelviews;
                if (modelviews && (modelviews.length > 0)) {
                    modelviews.sort(utils.compare);
                    modelviews.forEach(mv => {
                        if (model) this.importModelView(mv, model);
                    });
                }
                model.includeRelshipkind = item.includeRelshipkind;
                model.targetMetamodelRef = item.targetMetamodelRef;
                model.sourceModelRef = item.sourceModelRef;
                model.targetModelRef = item.targetModelRef;
                model.args1 = item.args1;
            }
            if (debug) console.log('863 item, model', item, model);
        }
    }
    importObject(item: any, model: cxModel | null) {
        const obj = this.findObject(item.id);
        if (obj) {
            const objtype = this.findObjectType(item.typeRef);
            if (debug) console.log('866 item, obj, objtype', item, obj, objtype);
            if (objtype) {
                obj.setType(objtype);
                obj.markedAsDeleted = item.markedAsDeleted;
                obj.generatedTypeId = item.generatedTypeId;
                if (model) {
                    model.addObject(obj);
                }
            } else {
                obj.typeName = item.typeName;
            }
            if (debug) console.log('623 model', model);
        }
    }
    importRelship(item: any, model: cxModel | null) {
        if (model) {
            const rel = this.findRelationship(item.id);
            if (debug) console.log('948 item, rel', item, rel);
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
                    rel.relshipkind     = item.relshipkind;
                    rel.cardinality     = item.cardinality;
                    rel.cardinalityFrom = item.cardinalityFrom;
                    rel.cardinalityTo   = item.cardinalityTo;
                    rel.markedAsDeleted = item.markedAsDeleted;
                    rel.generatedTypeId = item.generatedTypeId;
                    model.addRelationship(rel);
                    if (debug) console.log('966 fromObj, toObj, rel', fromObj, toObj, rel);
                }
            } else if (rel) {
                rel.typeName = item.typeName;
            } 
        }
    }
    importModelView(item: any, model: cxModel) {
        if (model) {
            const modelview = this.findModelView(item.id);
            if (modelview) {
                modelview.layout = item.layout;
                modelview.showCardinality = item.showCardinality;
                modelview.askForRelshipName = item.askForRelshipName;
                modelview.includeInheritedReltypes = item.includeInheritedReltypes;
                modelview.viewstyle = this.findViewStyle(item.viewstyleRef);
                model.addModelView(modelview);
                const objectviews: any[] = (item) && item.objectviews;
                objectviews.forEach(objview => {
                    if (objview) {
                        this.importObjectView(objview, modelview);
                        if (debug) console.log('630 model', model);
                    }
                });
                const relshipviews: any[] = item.relshipviews;
                if (debug) console.log('978 relshipviews', relshipviews);
                relshipviews.forEach(relview => {
                    if (relview)
                        this.importRelshipView(relview, modelview);
                });
            }
            if (debug) console.log('641 model', model);
        }
    }
    importObjectView(item: any, modelview: cxModelView) {
        if (modelview) {
            const objview = this.findObjectView(item.id);
            if (objview) {
                if (debug) console.log('648 item, objview', item, objview);
                const object = this.findObject(item.objectRef);
                if (object) {
                    if (debug) console.log('651 item.markedAsDeleted', item.markedAsDeleted);
                    objview.setObject(object);
                    objview.setIcon(item.icon);
                    objview.setLoc(item.loc);
                    // objview.setLoc(item.loc);
                    objview.setSize(item.size);
                    objview.setScale(item.scale);
                    objview.setTextscale(item.textscale);
                    objview.setGroup(item.group);
                    objview.setIsGroup(item.isGroup);
                    objview.setMarkedAsDeleted(item.markedAsDeleted);
                    objview.isCollapsed = item.isCollapsed;
                    objview.text = item.text;
                    objview.modified = true;
                    if (debug) console.log('660 objview', objview);
                    if (item.typeviewRef) {
                        const objtypeview = this.findObjectTypeView(item.typeviewRef);
                        if (objtypeview) {
                            objview.setTypeView(objtypeview);
                            const viewdata = objtypeview.getData();
                            for (let prop in viewdata) {
                                if (item[prop] && item[prop] !== "") {
                                    objview[prop] = item[prop];
                                }
                            }
                        }
                    }
                    if (debug) console.log('672 objview.markedAsDeleted', objview.markedAsDeleted, objview);
                    object.addObjectView(objview);
                    if (debug) console.log('675 objview.markedAsDeleted', objview.markedAsDeleted, objview);
                }
                modelview.removeObjectView(objview);
                if (debug) console.log('677 modelview', objview.markedAsDeleted, objview, modelview);
                modelview.addObjectView(objview);
                if (debug) console.log('679 modelview', objview.markedAsDeleted, objview, modelview);
            }
        }
    }
    importRelshipView(item: any, modelview: cxModelView) {
        if (modelview) {
            if (debug) console.log('1034 item (relshipview): ', item);
            const relview = this.findRelationshipView(item.id);
            if (relview) {
                const relship = this.findRelationship(item.relshipRef);
                if (relship) {
                    relview.setRelationship(relship);
                    const fromobjview = modelview.findObjectView(item.fromobjviewRef) as cxObjectView;
                    const toobjview = modelview.findObjectView(item.toobjviewRef) as cxObjectView;
                    relview.setFromObjectView(fromobjview);
                    relview.setToObjectView(toobjview);
                    relview.textscale = item.textscale;
                    relview.arrowscale = item.arrowscale;
                    relview.fromArrow = item.fromArrow;
                    relview.toArrow = item.toArrow;
                    relview.points = item.points;
                    if (debug) console.log('1050 relview', relview);
                    if (item.typeviewRef) {
                        const reltypeview = this.findRelationshipTypeView(item.typeviewRef);
                        if (reltypeview) {
                            relview.setTypeView(reltypeview);
                            const viewdata = reltypeview.getData();
                            for (let prop in viewdata) {
                                if (item[prop] && item[prop] !== "") {
                                    relview[prop] = item[prop];
                                }
                            }
                        }
                    } else {
                        const reltypeview = relview.relship?.type?.typeview as cxRelationshipTypeView;
                        if (reltypeview) {
                            relview.setTypeView(reltypeview);
                            const viewdata = reltypeview.getData();
                            for (let prop in viewdata) {
                                if (item[prop] && item[prop] !== "") {
                                    relview[prop] = item[prop];
                                }
                            }
                        }
                    }
                    if (debug) console.log('1074 relview', relview);
                    relview.markedAsDeleted = item.markedAsDeleted;
                    if (debug) console.log("1076 item, relview: ", item, relview);
                    relship.addRelationshipView(relview);
                    modelview.addRelationshipView(relview);
                    relview.template = item.template;
                    if (debug) console.log("1078 item, relview: ", item.markedAsDeleted, relview.markedAsDeleted);
                    if (debug) console.log("1079 item, relview: ", item, relview);
                }
            }
        }
    }
    addItem(item: any) {
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
            case 'cxMethod':
                this.addMethod(item);
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
    addMetamodel(metamodel: cxMetaModel) {
        if (metamodel.category === constants.gojs.C_METAMODEL) {
            if (this.metamodels == null)
                this.metamodels = new Array();
            if (!this.findMetamodel(metamodel.id))
                this.metamodels.push(metamodel);
            else {
                const mms = this.metamodels;
                for (let i=0; i<mms.length; i++) {
                    const mm = mms[i];
                    if (mm.id === metamodel.id) {
                        mms[i] = metamodel;
                        break;
                    }
                }
            }
        }
    }
    addModel(model: cxModel) {
        if (model.category === constants.gojs.C_MODEL) {
            //model.setMetis(this);
            if (this.models == null)
                this.models = new Array();
            if (!this.findModel(model.id))
                this.models.push(model);
        }
    }
    addModelView(modelview: cxModelView) {
        if (modelview.category === constants.gojs.C_MODELVIEW) {
            //modelview.setMetis(this);
            if (this.modelviews == null)
                this.modelviews = new Array();
            if (!this.findModelView(modelview.id))
                this.modelviews.push(modelview);
        }
    }
    addDatatype(dtype: cxDatatype) {
        if (dtype.category === constants.gojs.C_DATATYPE) {
            //dtype.setMetis(this);
            if (this.datatypes == null)
                this.datatypes = new Array();
            if (!this.findDatatype(dtype.id))
                this.datatypes.push(dtype);
        }
    }
    addViewStyle(vs: cxViewStyle) {
        if (vs.category === constants.gojs.C_VIEWSTYLE) {
            if (this.viewstyles == null)
                this.viewstyles = new Array();
            if (!this.findViewStyle(vs.id))
                this.viewstyles.push(vs);
        }
    }
    addGeometry(geo: cxGeometry) {
        if (geo.category === constants.gojs.C_GEOMETRY) {
            if (this.geometries == null)
                this.geometries = new Array();
            if (!this.findGeometry(geo.id))
                this.geometries.push(geo);
        }
    }
    addViewFormat(fmt: cxViewFormat) {
        if (fmt.category === constants.gojs.C_VIEWFORMAT) {
            //dtype.setMetis(this);
            if (this.viewformats == null)
                this.viewformats = new Array();
            if (!this.findViewFormat(fmt.id))
                this.viewformats.push(fmt);
        }
    }
    addFieldType(typ: cxFieldType) {
        if (typ.category === constants.gojs.C_FIELDTYPE) {
            if (this.fieldTypes == null)
                this.fieldTypes = new Array();
            if (!this.findFieldType(typ.id))
                this.fieldTypes.push(typ);
        }
    }
    addInputPattern(pattern: cxInputPattern) {
        if (pattern.category === constants.gojs.C_INPUTPATTERN) {
            //dtype.setMetis(this);
            if (this.inputpatterns == null)
                this.inputpatterns = new Array();
            if (!this.findInputPattern(pattern.id))
                this.inputpatterns.push(pattern);
        }
    }
    addEnumeration(enumval: cxEnumeration) {
        if (enumval.category === constants.gojs.C_ENUMERATION) {
            //enumval.setMetis(this);
            if (this.enumerations == null)
                this.enumerations = new Array();
            this.enumerations.push(enumval);
        }
    }
    addUnit(unit: cxUnit) {
        if (unit.category === constants.gojs.C_UNIT) {
            //unit.setMetis(this);
            if (this.units == null)
                this.units = new Array();
            this.units.push(unit);
        }
    }
    addUnitCategory(cat: cxUnitCategory) {
        if (cat.category === constants.gojs.C_UNITCATEGORY) {
            if (this.categories == null)
                this.categories = new Array();
            this.categories.push(cat);
        }
    }
    addProperty(prop: cxProperty) {
        if (!prop) return;
        if (prop.category === constants.gojs.C_PROPERTY) {
            const props = new Array();
            const len = this.properties?.length;
            if (!len)
                props.push(prop);
            else {
                let found = false;
                for (let i=0; i<len; i++) {
                    const p = this.properties[i];
                    if (!p) continue;
                    if (p.id === prop.id) {
                        props.push(prop);
                        found = true;
                    } else
                        props.push(p);
                }
                if (!found)
                    props.push(prop);
            }
            this.properties = props;
        }
    }
    addMethodType(mtd: cxMethodType) {
        if (!mtd) return;
        if (mtd.category === constants.gojs.C_METHODTYPE) {
            const mtds = new Array();
            const len = this.methodtypes?.length;
            if (!len)
                mtds.push(mtd);
            else {
                let found = false;
                for (let i=0; i<len; i++) {
                    const m = this.methodtypes[i];
                    if (!m) continue;
                    if (m.id === mtd.id) {
                        mtds.push(mtd);
                        found = true;
                    } else
                        mtds.push(m);
                }
                if (!found)
                    mtds.push(mtd);
            }
            this.methodtypes = mtds;
        }
    }
    addMethod(mtd: cxMethod) {
        if (!mtd) return;
        if (mtd.category === constants.gojs.C_METHOD) {
            const mtds = new Array();
            const len = this.methods?.length;
            if (!len)
                mtds.push(mtd);
            else {
                let found = false;
                for (let i=0; i<len; i++) {
                    const m = this.methods[i];
                    if (!m) continue;
                    if (m.id === mtd.id) {
                        mtds.push(mtd);
                        found = true;
                    } else
                        mtds.push(m);
                }
                if (!found)
                    mtds.push(mtd);
            }
            this.methods = mtds;
        }
    }
    addObjectType(objtype: cxObjectType) {
        if (objtype.category === constants.gojs.C_OBJECTTYPE) {
            //objtype.setMetis(this);
            if (this.objecttypes == null)
                this.objecttypes = new Array();
            if (!this.findObjectType(objtype.id))
                this.objecttypes.push(objtype);
        }
    }
    addRelationshipType(reltype: cxRelationshipType) {
        if (reltype.category === constants.gojs.C_RELSHIPTYPE) {
            //reltype.setMetis(this);
            if (this.relshiptypes == null)
                this.relshiptypes = new Array();
            if (!this.findRelationshipType(reltype.id))
                this.relshiptypes.push(reltype);
        }
    }
    addObjectTypeView(objtypeview: cxObjectTypeView) {
        if (objtypeview.category === constants.gojs.C_OBJECTTYPEVIEW) {
            //objtypeview.setMetis(this);
            if (this.objecttypeviews == null)
                this.objecttypeviews = new Array();
            if (!this.findObjectTypeView(objtypeview.id))
                this.objecttypeviews.push(objtypeview);
            else {
                const len = this.objecttypeviews.length;
                for (let i=0; i<len; i++) {
                    const otview = this.objecttypeviews[i];
                    if (debug) console.log('1355 objview', otview);
                    if (otview.id === objtypeview.id) {
                        // Object view is already in list, copy values
                        for (let prop in objtypeview) {
                            otview[prop] = objtypeview[prop];
                        }
                        if (debug) console.log('1361 objview', otview);
                        return;
                    }
                }
            }
        }
    }
    addRelationshipTypeView(reltypeview: cxRelationshipTypeView) {
        if (reltypeview.category === constants.gojs.C_RELSHIPTYPEVIEW) {
            //reltypeview.setMetis(this);
            if (this.relshiptypeviews == null)
                this.relshiptypeviews = new Array();
            if (!this.findRelationshipTypeView(reltypeview.id)) {
                this.relshiptypeviews.push(reltypeview);
                if (debug) console.log('1373 reltypeview', reltypeview);
            } else {
                const len = this.relshiptypeviews.length;
                for (let i=0; i<len; i++) {
                    const rtview = this.relshiptypeviews[i];
                    if (debug) console.log('1378 rtview', rtview);
                    if (rtview.id === reltypeview.id) {
                        // Relship typeview is already in list, copy values
                        for (let prop in reltypeview) {
                            if (prop === 'id') continue;
                            if (prop === 'name') continue;
                            rtview[prop] = reltypeview[prop];
                            rtview.data[prop] = reltypeview[prop];
                        }
                        if (debug) console.log('1387 rtview', rtview);
                        return;
                    }
                }
            }
        }
    }
    addObjtypeGeo(objtypegeo: cxObjtypeGeo) {
        if (objtypegeo.category === constants.gojs.C_OBJECTTYPEGEO) {
            //objtypegeo.setMetis(this);
            if (this.objtypegeos == null)
                this.objtypegeos = new Array();
            if (!this.findObjtypeGeo(objtypegeo.id))
                this.objtypegeos.push(objtypegeo);
        }
    }
    addObject(obj: cxObject) {
        if (obj.category === constants.gojs.C_OBJECT) {
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
        if (rel.category === constants.gojs.C_RELATIONSHIP) {
            //rel.setMetis(this);
            if (this.relships == null)
                this.relships = new Array();
            if (!this.findRelationship(rel.id))
                this.relships.push(rel);
        }
    }
    addObjectView(objview: cxObjectView) {
        if (objview.category === constants.gojs.C_OBJECTVIEW) {
            //objview.setMetis(this);
            if (this.objectviews == null)
                this.objectviews = new Array();
            if (!this.findObjectView(objview.id))
                this.objectviews.push(objview);
            else {
                const len = this.objectviews.length;
                for (let i=0; i<len; i++) {
                    const oview = this.objectviews[i];
                    if (debug) console.log('1355 objview', oview);
                    if (oview.id === objview.id) {
                        // Object view is already in list, copy values
                        for (let prop in objview) {
                            oview[prop] = objview[prop];
                        }
                        if (debug) console.log('1361 objview', oview);
                        return;
                    }
                }
            }
        }
    }
    addRelationshipView(relview: cxRelationshipView) {
        if (relview.category === constants.gojs.C_RELSHIPVIEW) {
            // if (relview.fromObjview && relview.toObjview) {
                    if (this.relshipviews == null)
                    this.relshipviews = new Array();
                if (!this.findRelationshipView(relview.id))
                    this.relshipviews.push(relview);
            // }
        }
    }
    setGojsModel(model: gjs.goModel) {
        this.gojsModel = model;
    }
    getGojsModel(): gjs.goModel {
        return this.gojsModel;
    }
    getMetamodels(): cxMetaModel[] | null {
        return this.metamodels;
    }
    getModels(): cxModel[] | null {
        return this.models;
    }
    getModelsByMetamodel(metamodel: cxMetaModel, includeDeleted: boolean): cxModel[] {
        let models = new Array();
        const mdls = this.models;
        for (let i=0; i<mdls.length; i++) {
            const model = mdls[i];
            const mm = model.metamodel;
            if (!includeDeleted && mm && !mm.isDeleted()) {
                if (mm.id === metamodel.id) {
                    models.push(model);
                }
            }
        }
        return models;
    }
    getModels2(includeDeleted: boolean): cxModel[] | null {
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
    getTemplateModels(): cxModel[] | null {
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
    getModelViews(): cxModelView[] | null {
        return this.modelviews;
    }
    getModelViewsByModel(model: cxModel): cxModelView[] | null {
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
    getTemplateModelviewByName(name: string): cxModelView | null {
        if (name && (name.length > 0)) {
            const mviews = this.modelviews;
            if (mviews) {
                const l = mviews.length;
                for (let i = 0; i < l; i++) {
                    const mview = mviews[i];
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
    getTemplateModelviews(): cxModelView[] | null {
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
    getDatatypes(): cxDatatype[] | null {
        return this.datatypes;
    }
    getViewFormats(): cxViewFormat[] | null {
        return this.viewformats;
    }
    getFieldTypes(): cxFieldType[] | null {
        return this.fieldTypes;
    }
    getInputPatterns(): cxInputPattern[] | null {
        return this.inputpatterns;
    }
    getEnumerations(): cxEnumeration[] | null {
        return this.enumerations;
    }
    getUnits(): cxUnit[] | null {
        return this.units;
    }
    getUnitCategories(): cxUnitCategory[] | null {
        return this.categories;
    }
    getProperties(): cxProperty[] | null {
        return this.properties;
    }
    getMethodTypes(): cxMethodType[] | null {
        return this.methodtypes;
    }
    getMethods(): cxMethod[] | null {
        return this.methods;
    }
    getObjectTypes(): cxObjectType[] | null {
        return this.objecttypes;
    }
    getRelationshipTypes(): cxRelationshipType[] | null {
        return this.relshiptypes;
    }
    getObjectTypeViews(): cxObjectTypeView[] | null {
        return this.objecttypeviews;
    }
    getObjtypeGeos(): cxObjtypeGeo[] | null {
        return this.objtypegeos;
    }
    getRelshipTypes(): cxRelationshipType[] | null {
        return this.relshiptypes;
    }
    getRelationshipTypeViews(): cxRelationshipTypeView[] | null {
        return this.relshiptypeviews;
    }
    getObjects(): cxObject[] | null {
        return this.objects;
    }
    getObjectsByType(objtype: cxObjectType, includeSubTypes: boolean): cxObject[] | null {
        let objects = new Array();
        if (this.objects) {
            for (let i = 0; i < this.objects.length; i++) {
                let obj = this.objects[i];
                if (obj && !obj.markedAsDeleted) {
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
    getRelationships(): cxRelationship[] | null {
        return this.relships;
    }
    getRelationshipsByType(reltype: cxRelationshipType, includeSubTypes: boolean): cxRelationship[] | null {
        let relships = new Array();
        if (this.relships) {
            for (let i = 0; i < this.relships.length; i++) {
                let rel = this.relships[i];
                if (rel && !rel.markedAsDeleted) {
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
    getRelationshipsByGeneratedTypeId(reltypeId: string): cxRelationship[] | null {
        let relships = new Array();
        if (this.relships) {
            for (let i = 0; i < this.relships.length; i++) {
                let rel = this.relships[i];
                if (rel && !rel.markedAsDeleted) {
                    if (rel.generatedTypeId === reltypeId)
                        relships.push(rel);
                }
            }
        }
        return relships;
    }
    getObjectViews(): cxObjectView[] | null {
        return this.objectviews;
    }
    getObjectViewsByObject(objid: string): cxObjectView[] | null {
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
    getRelationshipViews(): cxRelationshipView[] | null {
        return this.relshipviews;
    }
    getRelationshipViewsByRelship(relid: string): cxRelationshipView[] | null {
        const relshipviews = this.relshipviews;
        const relviews = new Array();
        for (let i = 0; i < relshipviews.length; i++) {
            const relview = relshipviews[i];
            if (relview) {
                const rel = relview.relship;
                if (rel && rel.id === relid)
                    relviews.push(relview);
            }
        }
        return relviews;
    }
    findItem(coll: string, id: string): any | null {
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
            case 'methods':
                retval = this.findMethod(id);
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
    findDatatype(id: string): cxDatatype | null {
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
    findViewStyle(id: string): cxViewStyle | null {
        let vstyles = this.viewstyles;
        if (!vstyles)
            return null;
        else {
            let i = 0;
            while (i < vstyles.length) {
                let vstyle = vstyles[i];
                if (vstyle && vstyle.id === id)
                    return vstyle;
                i++;
            }
        }
        return null;
    }
    findViewStyleByName(name: string): cxViewStyle | null {
        let vstyles = this.viewstyles;
        if (!vstyles) return null;
        let i = 0;
        let vstyle = null;
        while (i < vstyles.length) {
            vstyle = vstyles[i];
            let name = vstyle.getName();
            if (name.toLowerCase() === name.toLowerCase())
                return vstyle;
            i++;
        }
        return null;
    }
    findGeometry(id: string): cxGeometry | null {
        let geos = this.geometries;
        if (!geos)
            return null;
        else {
            let i = 0;
            while (i < geos.length) {
                let geo = geos[i];
                if (geo && geo.id === id)
                    return geo;
                i++;
            }
        }
        return null;
    }
    findGeometryByName(name: string): cxGeometry | null {
        let geos = this.geometries;
        if (!geos) return null;
        let i = 0;
        let geo = null;
        while (i < geos.length) {
            geo = geos[i];
            let name = geo.getName();
            if (name.toLowerCase() === name.toLowerCase())
                return geo;
            i++;
        }
        return null;
    }
    findViewFormat(id: string): cxViewFormat | null {
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
    findFieldType(id: string): cxFieldType | null {
        let types = this.getFieldTypes();
        if (!types)
            return null;
        else {
            let i = 0;
            while (i < types.length) {
                let type = types[i];
                if (type && type.id === id)
                    return type;
                i++;
            }
        }
        return null;
    }
    findInputPattern(id: string): cxInputPattern | null {
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
    findDatatypeByName(name: string): cxDatatype | null {
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
    findEnumeration(id: string): cxEnumeration | null {
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
    findProject(id: string): cxProject | null {
        const projects = this.projects;
        if (!projects) {
            return null;
        } else {
            let i = 0;
            let project = null;
            while (i < projects.length) {
                project = projects[i];
                if (project) {
                    if (project.id === id)
                        return project;
                    else if (project.getFirestoreId() === id)
                        return project;
                }
                i++;
            }
        }
        return null;
    }
    findMetamodel(id: string): cxMetaModel | null {
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
    findMetamodelByName(name: string): cxMetaModel | null {
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
    findModel(id: string): cxModel | null {
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
    findModelView(id: string): cxModelView | null {
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
    findModelByName(name: string): cxModel | null {
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
    findModelsByName(name: string): cxModel[] | null {
        const models = [];
        const allModels = this.getModels();
        if (!allModels) {
            return null;
        } else {
            let i = 0;
            let model = null;
            while (i < models.length) {
                model = models[i];
                if (model.getName() === name)
                    models.push(model);
                i++;
            }
            return models;
        }
        return null;
    }
    findModelByMetamodelAndName(metamodel: cxMetaModel, name: string): cxModel | null {
        const models = this.getModels();
        if (!models) {
            return null;
        } else {
            let i = 0;
            let model = null;
            while (i < models.length) {
                model = models[i];
                if (model.metamodel.id === metamodel.id) {
                    if (model.getName() === name)
                        return model;
                }
                i++;
            }
        }
        return null;
    }
    findObjectType(id: string): cxObjectType | null {
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
    findObjectTypeByName(name: string): cxObjectType | null {
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
    findObjectTypeView(id: string): cxObjectTypeView | null {
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
    findObjtypeGeo(id: string): cxObjtypeGeo | null {
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
    findObject(id: string): cxObject | null {
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
    findObjectByTypeAndName(type: cxObjectType, name: string): cxObject | null {
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
    findObjectView(id: string): cxObjectView | null {
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
    findProperty(id: string): cxProperty | null {
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
    findPropertyByName(propname: string): cxProperty | null {
        let properties = this.getProperties();
        if (!properties)
            return null;
        else {
            let i = 0;
            let prop = null;
            while (i < properties.length) {
                prop = properties[i];
                if (prop.isDeleted()) continue;
                if (prop.name === propname)
                    return prop;
                i++;
            }
        }
        return null;
    }
    findMethodType(id: string): cxMethodType | null {
        let mtypes = this.getMethodTypes(); 
        if (!mtypes)
            return null;
        else {
            let i = 0;
            let mtyp = null;
            while (i < mtypes.length) {
                mtyp = mtypes[i];
                if (mtyp) {
                    if (mtyp.id === id)
                        return mtyp;
                    else if (mtyp.getFirestoreId() === id)
                        return mtyp;
                }
                i++;
            }
        }
        return null;
    }
    findMethodTypeByName(name: string): cxMethod | null {
        const mtypes = this.getMethodTypes();
        if (!mtypes) return null;
        let i = 0;
        let mtyp = null;
        for (i = 0; i < mtypes.length; i++) {
            mtyp = mtypes[i];
            if (mtyp.isDeleted()) continue;
            if (mtyp.getName() === name)
                return mtyp;
        }
        return null;
    }
    findMethod(id: string): cxMethod | null {
        let methods = this.getMethods(); 
        if (!methods)
            return null;
        else {
            let i = 0;
            let mtd = null;
            while (i < methods.length) {
                mtd = methods[i];
                if (mtd) {
                    if (mtd.id === id)
                        return mtd;
                    else if (mtd.getFirestoreId() === id)
                        return mtd;
                }
                i++;
            }
        }
        return null;
    }
    findMethodByName(name: string): cxMethod | null {
        const mtds = this.getMethods();
        if (!mtds) return null;
        let i = 0;
        let mtd = null;
        for (i = 0; i < mtds.length; i++) {
            mtd = mtds[i];
            if (mtd.isDeleted()) continue;
            if (mtd.getName() === name)
                return mtd;
        }
        return null;
    }
    findRelationshipType(id: string): cxRelationshipType | null {
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
    findRelationshipTypesByName(name: string): cxRelationshipType[] | null {
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
    findRelationshipTypeByName(name: string): cxRelationshipType | null {
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
    findRelationshipTypeByName1(name: string, fromObjType: cxObjectType, toObjType: cxObjectType): cxRelationshipType | null {
        const types = this.getRelationshipTypes();
        if (!types) {
            return null;
        } else {
            for (let i = 0; i<types.length; i++) {
                let reltype = types[i] as cxRelationshipType;
                if (reltype.isDeleted()) continue;
                if (reltype.getName() === name) {
                    if (reltype.fromObjtype?.id === fromObjType?.id) {
                        if (reltype.toObjtype?.id === toObjType?.id) {
                            return reltype;
                        }
                    }
                }
            }
        }
        return null;
    }
    findRelationshipTypeByName2(name: string, fromObjType: cxObjectType, toObjType: cxObjectType): cxRelationshipType | null {
        const types = this.getRelationshipTypes();
        if (debug) console.log('2171 types', types.length, types);
        if (!types) {
            return null;
        } else {
            let reltype: cxRelationshipType | null = null;
            for (let i=0; i<types.length; i++) {
                reltype = types[i];
                if (debug) console.log('2178 reltype', reltype, fromObjType, toObjType);
                if (reltype.isDeleted()) continue;
                if (reltype.getName() === name) {
                    if (debug) console.log('2181 reltype', reltype, fromObjType, toObjType);
                    if (reltype.isAllowedFromType(fromObjType, this.objecttypes, this.relshiptypes)) {
                        if (debug) console.log('2183 reltype', reltype.name, fromObjType.name);
                        if (reltype.isAllowedToType(toObjType, this.objecttypes, this.relshiptypes)) {
                            if (debug) console.log('2185 reltype', reltype.name, toObjType.name);
                            return reltype; 
                        }
                    }
                }
            }
        }
        return null;
    }
    findRelationshipTypesBetweenTypes(fromType: cxObjectType, toType: cxObjectType): cxRelationshipType[] | null {
        if (!fromType || !toType)
            return null;
        let reltypes = new Array();
        let types = this.getRelationshipTypes();
        if (!types) {
            return null;
        } else {
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
                            if (debug) console.log('1556 reltype', reltype.name, fromType.name);
                            if (reltype.isAllowedToType(toType, this.objecttypes, this.relshiptypes)) {
                                if (debug) console.log('1558 reltype', reltype.name, toType.name);
                                reltypes.push(reltype); 
                            }
                        }
                    }
                }
            }
        }
        return reltypes;
    }
    findRelationshipTypeView(id: string): cxRelationshipTypeView | null {
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
    findRelationship(id: string): cxRelationship | null {
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
    findRelationshipView(id: string): cxRelationshipView | null {
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
    findSubMetamodel(id: string): cxModel | null {
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
    findUnit(id: string): cxUnit | null {
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
    findUnitByName(name: string): cxUnit | null {
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
    findUnitCategory(id: string): cxUnitCategory | null {
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
    findUnitCategoryByName(name: string): cxUnitCategory | null {
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
    setCurrentModelview(modelview: cxModelView) {
        this.currentModelview = modelview;
    }
    getCurrentModelview(): cxModelView | null {
        return this.currentModelview;
    }
    setCurrentModel(model: cxModel) {
        this.currentModel = model;
    }
    getCurrentModel(): cxModel | null {
        return this.currentModel;
    }
    setCurrentTemplateModel(model: cxModel) {
        this.currentTemplateModel = model;
    }
    getCurrentTemplateModel(): cxModel | null {
        return this.currentTemplateModel;
    }
    setCurrentMetamodel(metamodel: cxMetaModel) {
        this.currentMetamodel = metamodel;
        this.currentMetamodelRef = metamodel.id;
    }
    getCurrentMetamodel(): cxMetaModel | null {
        return this.currentMetamodel;
    }
    setCurrentTargetMetamodel(metamodel: cxMetaModel) {
        this.currentTargetMetamodel = metamodel;
        this.currentTargetMetamodelRef = metamodel.id;
    }
    getcurrentTargetMetamodel(): cxMetaModel | null {
        return this.currentTargetMetamodel;
    }
    setCurrentTargetModel(model: cxModel) {
        this.currentTargetModel = model;
        this.currentTargetModelRef = model.id;
    }
    getCurrentTargetModel(): cxModel | null {
        return this.currentTargetModel;
    }
    setCurrentTargetModelview(modelview: cxModelView) {
        this.currentTargetModelview = modelview;
    }
    getCurrentTargetModelview(): cxModelView | null {
        return this.currentTargetModelview;
    }
    setCurrentTaskModel(model: cxModel) {
        this.currentTaskModel = model;
        this.currentTaskModelRef = model.id;
    }
    getCurrentTaskModel(): cxModel | null {
        return this.currentTaskModel;
    }
    isAdminType(type: cxObjectType) {
        if (!type)
            return false;
        if (type.name === 'Project' || 
            type.name === 'Metamodel' || 
            type.name === 'Model' || 
            type.name === 'Modelview'
            ) {
            return true;
        }
        return false;
    }
}

// -------  cxMetaObject - Den mest supre av alle supertyper  ----------------

export class cxMetaObject {
    id:                 string;
    name:               string;
    nameId:             string;
    category:           string;
    description:        string;
    sourceUri:          string;
    markedAsDeleted:    boolean;
    modified:           boolean;
    fs_collection:      string;
    // Constructor
    constructor(id: string, name: string, description: string) {
        this.fs_collection = "";  // Firestore collection
        this.id = id;
        this.name = name;
        this.nameId = name;
        this.category = "";
        this.sourceUri = "";
        this.markedAsDeleted = false;
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
    getId(): string {
        if (this.id)
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
        if (this.name)
            return this.name;
        else
            return "";
    }
    setDescription(description: string) {
        this.description = description;
    }
    getDescription(): string {
        if (this.description)
            return this.description;
        else
            return "";
    }
    setMarkedAsDeleted(deleted: boolean) {
        this.markedAsDeleted =deleted;
    }
    getMarkedAsDeleted(): boolean {
        return this.markedAsDeleted;
    }
    setDeleted(deleted: boolean) {
        this.markedAsDeleted =deleted;
    }
    isDeleted(): boolean {
        return this.markedAsDeleted;
    }
    setModified() {
        this.modified = true;
    }
    clearModified() {
        this.modified = false;
    }
    isModified(): boolean {
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

// --------  cxProject ---------------------------------------------------
export class cxProject extends cxMetaObject {
    metamodels: cxMetaModel[] | null;
    models:     cxModel[];
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.metamodels = null;
        this.models = null;
    }
    addMetamodel(metamodel: cxMetaModel) {
        if (metamodel.category === constants.gojs.C_METAMODEL) {
            if (this.metamodels == null)
                this.metamodels = new Array();
            if (!this.findMetamodel(metamodel.id))
                this.metamodels.push(metamodel);
            else {
                const mms = this.metamodels;
                for (let i=0; i<mms.length; i++) {
                    const mm = mms[i];
                    if (mm.id === metamodel.id) {
                        mms[i] = metamodel;
                        break;
                    }
                }
            }
        }
    }
    addModel(model: cxModel) {
        if (model.category === constants.gojs.C_MODEL) {
            //model.setMetis(this);
            if (this.models == null)
                this.models = new Array();
            if (!this.findModel(model.id))
                this.models.push(model);
        }
    }
    findMetamodel(id: string): cxMetaModel | null {
        const metamodels = this.metamodels;
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
    findModel(id: string): cxModel | null {
        const models = this.models;
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
}

// ---------  Data Types, Categories and Units --------------------------

export class cxDatatype extends cxMetaObject {
    isOfDatatype:       cxDatatype | null;
    allowedValues:      string[];   // array of strings
    defaultValue:       string;
    value:              string;
    inputPattern:       string;
    viewFormat:         string;
    fieldType:          string;
    pointerType:        cxObjectType;
    pointerCriteria:    string;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_DATATYPES;  // Firestore collection
        this.category      = constants.gojs.C_DATATYPE;
        this.isOfDatatype  = null;
        this.inputPattern  = "";
        this.viewFormat    = "";
        this.fieldType     = "text";
        this.allowedValues = null;
        this.defaultValue  = "";
        this.value         = "";
        this.pointerType   = null;
        this.pointerCriteria = "";

        if (debug) console.log('1915 datatype: ', this);
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
    getAllowedValues(): string[] {
        return this.allowedValues;
    }
    setDefaultValue(val: string) {
        this.defaultValue = val;
    }
    getDefaultValue(): string {
        return this.defaultValue;
    }
    setValue(val: string) {
        this.value = val;
    }
    getValue(): string {
        return this.value;
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
    setViewFormat(val: string) {
        this.viewFormat = val;
    }
    getViewFormat(): string {
        return this.viewFormat;
    }
    setFieldType(val: string) {
        this.fieldType = val;
    }
    getFieldType(): string {
        return this.fieldType;
    }
    setPointerType(val: cxObjectType) {
        this.pointerType = val;
    }
    getPointerType(): cxObjectType {
        return this.pointerType;
    }
    setPointerCriteria(val: string) {
        this.pointerCriteria = val;
    }
    getPointerCriteria(): string {
        return this.pointerCriteria;
    }
}

export class cxUnitCategory extends cxMetaObject {
    units: cxUnit[] | null;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_CATEGORIES;  // Firestore collection
        this.category = constants.gojs.C_UNITCATEGORY;
        this.units = null;
    }
    // Methods
    addUnit(unit: cxUnit) {
        // Check if input is of correct category and not already in list (TBD)
        if (unit.category === constants.gojs.C_UNIT) {
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
        this.fs_collection = constants.fs.FS_C_UNITS;  // Firestore collection
        this.unitCategory = null;
    }
    // Methods
    setUnitCategory(cat: cxUnitCategory) {
        if (utils.objExists(cat)) {
            if (cat.category === constants.gojs.C_UNITCATEGORY) {
                this.unitCategory = cat;
            }
        }
    }
    getUnitCategory(): cxUnitCategory | null {
        return this.unitCategory;
    }
}

export class cxEnumeration extends cxMetaObject {
    enumvalues: any // array of enum values
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
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

export class cxMethodType extends cxMetaObject {
    properties: cxProperty[] | null;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.category = constants.gojs.C_METHODTYPE;
        this.properties = null;    
    }
    addProperty(prop: cxProperty) {
        if (!prop) return;
        if (prop.category === constants.gojs.C_PROPERTY) {
            const props = new Array();
            const len = this.properties?.length;
            if (!len)
                props.push(prop);
            else {
                let found = false;
                for (let i=0; i<len; i++) {
                    const p = this.properties[i];
                    if (!p) continue;
                    if (p.id === prop.id) {
                        props.push(prop);
                        found = true;
                    } else
                        props.push(p);
                }
                if (!found)
                    props.push(prop);
            }
            this.properties = props;
        }
    }
    findProperty(propid: string): cxProperty | null {
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
    findPropertyByName(propname: string): cxProperty | null {
        let properties = this.properties;
        if (!properties) {
            return null;
        } else {
            const noProperties = properties.length;
            let i = 0;
            while (i < noProperties) {
                if (properties[i]?.name === propname)
                    return properties[i];
                i++;
            }
            return null;
        }
    }
    getProperties(): cxProperty[] | null  {
        const props = this.properties;
        if (debug) console.log('2560 properties', this.properties);
        return this.properties;
    }
    hasProperties() {
        if (!this.properties)
            return false;
        else if (utils.isArrayEmpty(this.properties))
            return false;
        else
            return true;
    }
}

// -------------------------------------------------------------

export class cxMetaModel extends cxMetaObject {
    isEKA:       boolean;
    metamodels:  cxMetaModel[] | null;
    viewstyle:   cxViewStyle | null;
    viewstyles:  cxViewStyle[] | null;
    geometries:  cxGeometry[] | null;
    containers:  cxMetaContainer[] | null;
    objecttypes: cxObjectType[] | null;
    objtypegeos: cxObjtypeGeo[] | null;
    objecttypeviews:  cxObjectTypeView[] | null;
    relshiptypes:     cxRelationshipType[] | null;
    relshiptypeviews: cxRelationshipTypeView[] | null;
    objecttypes0:  cxObjectType[] | null;
    relshiptypes0: cxRelationshipType[] | null;
    properties:    cxProperty[] | null;
    methods:       cxMethod[] | null;
    methodtypes:   cxMethodType[] | null;
    enumerations:  cxEnumeration[] | null;
    units:         cxUnit[] | null;
    datatypes:     cxDatatype[] | null;
    viewformats:   cxViewFormat[] | null;
    fieldTypes:    cxFieldType[] | null;
    inputpatterns: cxInputPattern[] | null;
    categories:    cxUnitCategory[] | null;
    generatedFromModelRef: string;
    includeInheritedReltypes: boolean;
    layout:     string;
    routing:    string;
    linkcurve:  string;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_METAMODELS;  // Firestore collection
        this.category = constants.gojs.C_METAMODEL;
        this.clearContent();
    }
    // Methods
    clearContent() {
            this.metamodels = null;
            this.viewstyle  = null; // Current viewstyle
            this.viewstyles = [];
            this.geometries = [];
            this.containers = null;
            this.properties = null;
            this.methods = null;
            this.methodtypes = null;
            this.enumerations = null;
            this.units = null;
            this.datatypes = null;
            this.categories = null;
            this.generatedFromModelRef = "";
            this.isEKA = false;
            this.layout = "ForceDirected";
            this.routing = "Normal";
            this.linkcurve = "None";  
            this.includeInheritedReltypes = false;
            this.objecttypes  = null;
            this.objecttypes0 = null;
            this.objtypegeos  = null;
            this.objecttypeviews = null;
            this.relshiptypes  = null;
            this.relshiptypes0 = null;
            this.relshiptypeviews = null;
            
    }
    getLoc(type: cxObjectType): string {
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
    getSize(type: cxObjectType): string {
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
    setGeometries(geos: cxGeometry[]) {
        this.geometries = geos;
    }
    close() {
        this.metamodels = null;
        this.objecttypes = null;
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
    getCategories(): cxUnitCategory[] | null {
        return this.categories;
    }
    getDatatypes(): cxDatatype[] | null {
        return this.datatypes;
    }
    getViewStyles(): cxViewStyle[] | null {
        return this.viewstyles;
    }
    getGeometries(): cxGeometry[] | null {
        return this.geometries;
    }
    getViewFormats(): cxViewFormat[] | null {
        return this.viewformats;
    }
    getFieldTypes(): cxFieldType[] | null {
        return this.fieldTypes;
    }
    getInputPatterns(): cxInputPattern[] | null {
        return this.inputpatterns;
    }
    getEnumerations(): cxEnumeration[] | null {
        return this.enumerations;
    }
    getObjtypeNames(): string[] {
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
    getObjectTypes(): cxObjectType[] | null {
        return this.objecttypes;
    }
    getObjectTypes0(): cxObjectType[] | null {
        return this.objecttypes0;
    }
    getObjectTypeViews(): cxObjectTypeView[] | null {
        return this.objecttypeviews;
    }
    getObjtypeGeos(): cxObjtypeGeo[] | null {
        return this.objtypegeos;
    }
    getProperties(): cxProperty[] | null {
        return this.properties;
    }
    getMethods(): cxMethod[] | null {
        return this.methods;
    }
    getMethodTypes(): cxMethodType[] | null {
        return this.methodtypes;
    }
    getReltypeNames(ignoreGen: boolean): string[] {
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
    getEkaReltypeNames(): string[] {
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
    getRelshipTypes(): cxRelationshipType[] | null {
        return this.relshiptypes;
    }
    getRelshipTypes0(): cxRelationshipType[] | null {
        return this.relshiptypes0;
    }
    getRelshipTypeViews(): cxRelationshipTypeView[] | null {
        return this.relshiptypeviews;
    }
    getSubMetamodels(): cxMetaModel[] | null {
        return this.metamodels;
    }
    getMetaContainers(): any[] | null {
        return this.containers;
    }
    getUnits(): cxUnit[] | null {
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
            case 'cxMethod':
                this.addMethod(item);
            case 'cxObjectTypeView':
                this.addObjectTypeView(item);
                break;
            case 'cxRelationshipTypeView':
                this.addRelationshipTypeView(item);
                break;
        }
    }
    addMetamodel(metamodel: cxMetaModel) {
        // Check if input is of correct category and not already in list (TBD)
        if (metamodel.category === constants.gojs.C_METAMODEL) {
            if (this.metamodels == null)
                this.metamodels = new Array();
            if (!this.findSubMetamodel(metamodel.id))
                this.metamodels.push(metamodel);
        }
    }
    addDatatype(datatype: cxDatatype) {
        // Check if input is of correct category and not already in list (TBD)
        if (datatype.category === constants.gojs.C_DATATYPE) {
            if (this.datatypes == null)
                this.datatypes = new Array();
            if (!this.findDatatype(datatype.id))
                this.datatypes.push(datatype);
            else {
                const types = this.datatypes;
                for (let i = 0; i < types.length; i++) {
                    const type = types[i];
                    if (type.id === datatype.id) {
                        types[i] = datatype;
                        break;
                    }
                }
            }
        }
    }
    addViewStyle(vs: cxViewStyle) {
        if (vs.category === constants.gojs.C_VIEWSTYLE) {
            if (!this.viewstyle)
                this.viewstyle = vs;
            if (this.viewstyles == null)
                this.viewstyles = new Array();
            if (!this.findViewStyle(vs.id))
                this.viewstyles.push(vs);
        }
    }
    addGeometry(geo: cxGeometry) {
        if (geo.category === constants.gojs.C_GEOMETRY) {
            if (this.geometries == null)
                this.geometries = new Array();
            if (!this.findGeometry(geo.id))
                this.geometries.push(geo);
        }
    }
    addViewFormat(fmt: cxViewFormat) {
        if (fmt.category === constants.gojs.C_VIEWFORMAT) {
            if (this.viewformats == null)
                this.viewformats = new Array();
            if (!this.findViewFormat(fmt.id)) 
                this.viewformats.push(fmt);
        }
    }
    addFieldType(typ: cxFieldType) {
        if (typ.category === constants.gojs.C_FIELDTYPE) {
            if (this.fieldTypes == null)
                this.fieldTypes = new Array();
            if (!this.findFieldType(typ.id))
                this.fieldTypes.push(typ);
        }
    }
    addInputPattern(pattern: cxInputPattern) {
        if (pattern.category === constants.gojs.C_INPUTPATTERN) {
            if (this.inputpatterns == null)
                this.inputpatterns = new Array();
            if (!this.findInputPattern(pattern.id))
                this.inputpatterns.push(pattern);
        }
    }
    addEnumeration(Enum: cxEnumeration) {
        // Check if input is of correct category and not already in list (TBD)
        if (Enum.category === constants.gojs.C_ENUMERATION) {
            if (this.enumerations == null)
                this.enumerations = new Array();
            if (!this.findEnumeration(Enum.id))
                this.enumerations.push(Enum);
        }
    }
    addObjectType(objType: cxObjectType) {
        // Check if input is of correct category and not already in list (TBD)
        if (objType.category === constants.gojs.C_OBJECTTYPE) {
            if (this.objecttypes == null)
                this.objecttypes = new Array();
            if (!this.findObjectType(objType.id))
                this.objecttypes.push(objType);
            else {
                const types = this.objecttypes;
                for (let i = 0; i < types.length; i++) {
                    const type = types[i];
                    if (type.id === objType.id) {
                        types[i] = objType;
                        break;
                    }
                }
            }
        }
    }
    addObjectTypeByName(objType: cxObjectType) {
        // Check if input is of correct category and not already in list (TBD)
        if (objType.category === constants.gojs.C_OBJECTTYPE) {
            if (this.objecttypes == null)
                this.objecttypes = new Array();
            if (!this.findObjectTypeByName(objType.name))
                this.objecttypes.push(objType);
            else {
                const types = this.objecttypes;
                for (let i = 0; i < types.length; i++) {
                    const type = types[i];
                    if (type.name === objType.name) {
                        types[i] = objType;
                        break;
                    }
                }
            }
        }
    }
    addObjectType0(objType: cxObjectType) {
        // Check if input is of correct category and not already in list (TBD)
        if (objType && objType.category === constants.gojs.C_OBJECTTYPE) {
            if (this.objecttypes0 == null)
                this.objecttypes0 = new Array();
            if (!this.findObjectType0(objType.id))
                this.objecttypes0.push(objType);
            else {
                const types = this.objecttypes0;
                for (let i = 0; i < types.length; i++) {
                    const type = types[i];
                    if (type.id === objType.id) {
                        types[i] = objType;
                        break;
                    }
                }
            }
        }
    }
    removeObjectType(otype: cxObjectType) {
        if (otype.category === constants.gojs.C_OBJECTTYPE) {
            const objtypes = new Array();
            for (let i=0; i<this.objecttypes.length; i++) {
                if (this.findObjectType(otype.id)) 
                    continue;
                objtypes.push(otype);  

            }
            this.objecttypes = objtypes;
        }
    }
    addObjectTypeView(objtypeView: cxObjectTypeView) {
        // Check if input is of correct category and not already in list (TBD)
        if (objtypeView.category === constants.gojs.C_OBJECTTYPEVIEW) {
            if (this.objecttypeviews == null)
                this.objecttypeviews = new Array();
            if (!this.findObjectTypeView(objtypeView.id))
                this.objecttypeviews.push(objtypeView);
            else {
                const typeviews = this.objecttypeviews;
                for (let i = 0; i < typeviews.length; i++) {
                    const typeview = typeviews[i];
                    if (typeview.id === objtypeView.id) {
                        typeviews[i] = objtypeView;
                        break;
                    }
                }
            }
        }
    }
    addObjtypeGeo(objtypegeo: cxObjtypeGeo) {
        if (objtypegeo.category === constants.gojs.C_OBJECTTYPEGEO) {
            if (this.objtypegeos == null)
                this.objtypegeos = new Array();
            if (!this.findObjtypeGeo(objtypegeo.id))
                this.objtypegeos.push(objtypegeo);
            else {
                const geos = this.objtypegeos;
                for (let i = 0; i < geos.length; i++) {
                    const geo = geos[i];
                    if (geo.id === objtypegeo.id) {
                        geos[i] = objtypegeo;
                        break;
                    }
                }
            }
        }
    }
    addProperty(prop: cxProperty) {
        if (!prop) return;
        if (prop.category === constants.gojs.C_PROPERTY) {
            const props = new Array();
            const len = this.properties?.length;
            if (!len)
                props.push(prop);
            else {
                let found = false;
                for (let i=0; i<len; i++) {
                    const p = this.properties[i];
                    if (!p) continue;
                    if (p.id === prop.id) {
                        props.push(prop);
                        found = true;
                    } else
                        props.push(p);
                }
                if (!found)
                    props.push(prop);
            }
            this.properties = props;
        }
    }
    addMethod(mtd: cxMethod) {
        if (!mtd) return;
        if (mtd.category === constants.gojs.C_METHOD) {
            const mtds = new Array();
            const len = this.methods?.length;
            if (!len)
                mtds.push(mtd);
            else {
                let found = false;
                for (let i=0; i<len; i++) {
                    const m = this.methods[i];
                    if (!m) continue;
                    if (m.id === mtd.id) {
                        mtds.push(mtd);
                        found = true;
                    } else
                        mtds.push(m);
                }
                if (!found)
                    mtds.push(mtd);
            }
            this.methods = mtds;
        }
    }
    addMethodType(mtd: cxMethodType) {
        if (!mtd) return;
        if (mtd.category === constants.gojs.C_METHODTYPE) {
            const mtds = new Array();
            const len = this.methodtypes?.length;
            if (!len)
                mtds.push(mtd);
            else {
                let found = false;
                for (let i=0; i<len; i++) {
                    const m = this.methodtypes[i];
                    if (!m) continue;
                    if (m.id === mtd.id) {
                        mtds.push(mtd);
                        found = true;
                    } else
                        mtds.push(m);
                }
                if (!found)
                    mtds.push(mtd);
            }
            this.methodtypes = mtds;
        }
    }
    addRelationshipType(relType: cxRelationshipType) {
        // Check if input is of correct category and not already in list (TBD)
        if (relType.category === constants.gojs.C_RELSHIPTYPE) {
            if (this.relshiptypes == null)
                this.relshiptypes = new Array();
            if (!this.findRelationshipType(relType.id)) 
                this.relshiptypes.push(relType);
            else {
                const types = this.relshiptypes;
                for (let i = 0; i < types.length; i++) {
                    const type = types[i];
                    if (type.id === relType.id) {
                        types[i] = relType;
                        break;
                    }
                }
            }                
        }
    }
    addRelationshipType0(relType: cxRelationshipType) {
        // Check if input is of correct category and not already in list (TBD)
        if (relType.category === constants.gojs.C_RELSHIPTYPE) {
            if (this.relshiptypes0 == null)
                this.relshiptypes0 = new Array();
            if (!this.findRelationshipType0(relType.id)) 
                this.relshiptypes0.push(relType);
            else {
                const types = this.relshiptypes0;
                for (let i = 0; i < types.length; i++) {
                    const type = types[i];
                    if (type.id === relType.id) {
                        types[i] = relType;
                        break;
                    }
                }
            }                
        }
    }
    addRelationshipTypeView(reltypeview: cxRelationshipTypeView) {
        if (reltypeview.category === constants.gojs.C_RELSHIPTYPEVIEW) {
            //reltypeview.setMetis(this);
            if (this.relshiptypeviews == null)
                this.relshiptypeviews = new Array();
            if (!this.findRelationshipTypeView(reltypeview.id)) {
                this.relshiptypeviews.push(reltypeview);
                if (debug) console.log('3682 reltypeview', reltypeview);
            } else {
                const len = this.relshiptypeviews.length;
                for (let i=0; i<len; i++) {
                    const rtview = this.relshiptypeviews[i];
                    if (debug) console.log('3687 rtview', rtview);
                    if (rtview.id === reltypeview.id) {
                        // Relship typeview is already in list, copy values
                        for (let prop in reltypeview) {
                            if (prop === 'id') continue;
                            if (prop === 'data') continue;
                            rtview[prop] = reltypeview[prop];
                            rtview.data[prop] = reltypeview[prop];
                        }
                        if (debug) console.log('3694 rtview', rtview);
                        return;
                    }
                }
            }
        }
    }

    addSubMetamodel(metamodel: cxMetaModel) {
        // Check if input is of correct category and not already in list (TBD)
        if (metamodel.category === constants.gojs.C_METAMODEL) {
            if (this.metamodels == null)
                this.metamodels = new Array();
            if (!this.findSubMetamodel(metamodel.id))
                this.metamodels.push(metamodel);
        }
    }
    addMetaContainer(container: cxMetaContainer) {
        // Check if input is of correct category and not already in list (TBD)
        if (container.category === constants.gojs.C_METACONTAINER) {
            if (this.containers == null)
                this.containers = new Array();
            if (!this.findMetaContainer(container.id))
                this.containers.push(container);
        }
    }
    addUnit(unit: cxUnit) {
        // Check if input is of correct category and not already in list (TBD)
        if (unit.category === constants.gojs.C_UNIT) {
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
        // Check if input is of correct category and not already in list (TBD)
        if (category.category === constants.gojs.C_UNITCATEGORY) {
            if (this.categories == null)
                this.categories = new Array();
            if (!this.findUnitCategory(category.id))
                this.categories.push(category);
        }
    }
    findDatatype(id: string):cxDatatype | null {
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
    findDatatypeByName(name: string): cxDatatype | null {
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
    findViewFormat(id: string): cxViewFormat | null {
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
    findFieldType(id: string): cxFieldType | null {
        let types = this.getFieldTypes();
        if (!types)
            return null;
        else {
            let i = 0;
            while (i < types.length) {
                let type = types[i];
                if (type && type.id === id)
                    return type;
                i++;
            }
        }
        return null;
    }
    findInputPattern(id: string): cxInputPattern | null {
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
    findEnumeration(id: string): cxEnumeration | null {
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
    findObjectType(id: string): cxObjectType | null {
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
    findObjectType0(id: string): cxObjectType | null {
        const types = this.getObjectTypes0();
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
    findObjectTypeByName(name: string): cxObjectType | null {
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
    findObjectTypeView(id: string): cxObjectTypeView | null {
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
    findObjectTypeViewByName(name: string): cxObjectTypeView | null {
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
    findObjtypeGeo(id: string): cxObjtypeGeo | null {
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
    findObjtypeGeoByType(type: cxObjectType): cxObjtypeGeo | null {
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
    findProperty(id: string): cxProperty | null {
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
    findPropertyByName(name: string): cxProperty | null {
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
    findMethod(id: string): cxMethod | null {
        let methods = this.getMethods();
        if (!methods) return null;
        let i = 0;
        let mtd = null;
        for (i = 0; i < methods.length; i++) {
            mtd = methods[i];
            if (mtd && mtd.isDeleted) continue;
            if (mtd.id === id)
                return mtd;
        }
        return null;
    }
    findMethodByName(name: string): cxMethod | null {
        const mtds = this.getMethods();
        if (!mtds) return null;
        let i = 0;
        let mtd = null;
        for (i = 0; i < mtds.length; i++) {
            mtd = mtds[i];
            if (mtd.isDeleted()) continue;
            if (mtd.getName() === name)
                return mtd;
        }
        return null;
    }
    findMethodType(id: string): cxMethodType | null {
        let methodtypes = this.getMethodTypes();
        if (!methodtypes) return null;
        let i = 0;
        let mtd = null;
        for (i = 0; i < methodtypes.length; i++) {
            mtd = methodtypes[i];
            if (mtd && mtd.isDeleted) continue;
            if (mtd.id === id)
                return mtd;
        }
        return null;
    }
    findMethodTypeByName(name: string): cxMethodType | null {
        const mtds = this.getMethodTypes();
        if (!mtds) return null;
        let i = 0;
        let mtd = null;
        for (i = 0; i < mtds.length; i++) {
            mtd = mtds[i];
            if (mtd.isDeleted()) continue;
            if (mtd.getName() === name)
                return mtd;
        }
        return null;
    }
    findRelationshipType(id: string): cxRelationshipType | null {
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
    findRelationshipType0(id: string): cxRelationshipType | null {
        const types = this.getRelshipTypes0();
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
    findRelationshipTypeByName(name: string): cxRelationshipType | null {
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
    findRelationshipTypeByName1(name: string, fromObjType: cxObjectType, toObjType: cxObjectType): cxRelationshipType | null {
        const types = this.getRelshipTypes();
        if (!types) {
            return null;
        } else {
            for (let i = 0; i<types.length; i++) {
                let reltype = types[i] as cxRelationshipType;
                if (reltype.isDeleted()) continue;
                if (reltype.getName() === name) {
                    if (reltype.fromObjtype?.id === fromObjType?.id) {
                        if (reltype.toObjtype?.id === toObjType?.id) {
                            return reltype;
                        }
                    }
                }
            }
        }
        return null;
    }
    findRelationshipTypeByName2(name: string, fromObjType: cxObjectType, toObjType: cxObjectType): cxRelationshipType | null {
        const types = this.getRelshipTypes();
        if (!types) {
            return null;
        } else {
            for (let i = 0; i<types.length; i++) {
                let reltype = types[i] as cxRelationshipType;
                if (reltype.isDeleted()) continue;
                if (reltype.getName() === name) {
                    if (debug) console.log('3735 this.objecttypes, this.relshiptypes', this.objecttypes, this.relshiptypes);
                    if (reltype.isAllowedFromType(fromObjType, this.objecttypes, this.relshiptypes)) {
                        if (debug) console.log('3737 reltype', reltype, fromObjType, toObjType);
                        if (reltype.isAllowedToType(toObjType, this.objecttypes, this.relshiptypes)) {
                            if (debug) console.log('3739 reltype', reltype, fromObjType, toObjType);
                            return reltype;
                        }
                    }
                }
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
    findRelationshipTypesByName(name: string): cxRelationshipType[] | null {
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
    findEkaRelationshipTypeByName(name: string): cxRelationshipType | null {
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
    findRelationshipTypesBetweenTypes(fromType: cxObjectType, toType: cxObjectType, includeGen: boolean): cxRelationshipType[] | null {
        if (!fromType || !toType) return null;
        const types = this.getRelshipTypes();
        if (debug) console.log('2939 reltypes, objtypes', types, this.objecttypes);
        if (!types) return null;
        const reltypes = new Array();
        let i = 0;
        let reltype = null;
        for (i = 0; i < types.length; i++) {
            reltype = types[i];
            if (reltype.isDeleted()) continue;
            if (!reltype.fromObjtype) {
                const objtype = this.findObjectType(reltype.fromobjtypeRef);
                if (objtype)
                    reltype.fromObjtype = objtype;
                else
                    continue;
            }
            if (!reltype.toObjtype) {
                const objtype = this.findObjectType(reltype.toobjtypeRef);
                if (objtype)
                    reltype.toObjtype = objtype;
                else
                    continue;
            }
            if (includeGen) {
                if (debug) console.log('2948 reltype, fromType', reltype, fromType);
                if (reltype.isAllowedFromType(fromType, this.objecttypes, this.relshiptypes)) {
                    if (debug) console.log('2950 reltype, toType', reltype, toType);
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
    findRelationshipTypes0BetweenTypes(fromType: cxObjectType, toType: cxObjectType): cxRelationshipType[] | null {
        if (!fromType || !toType) return null;
        const types = this.getRelshipTypes0();
        if (debug) console.log('2939 reltypes, objtypes', types, this.objecttypes);
        if (!types) return null;
        const reltypes = new Array();
        let i = 0;
        let reltype = null;
        for (i = 0; i < types.length; i++) {
            reltype = types[i];
            if (reltype.isDeleted()) continue;
            if (!reltype.fromObjtype) {
                const objtype = this.findObjectType(reltype.fromobjtypeRef);
                if (objtype)
                    reltype.fromObjtype = objtype;
                else
                    continue;
            }
            if (!reltype.toObjtype) {
                const objtype = this.findObjectType(reltype.toobjtypeRef);
                if (objtype)
                    reltype.toObjtype = objtype;
                else
                    continue;
            }
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
    findRelationshipTypeView(id: string): cxRelationshipTypeView | null {
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
    findSubMetamodel(id: string): cxMetaModel | null {
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
    findMetaContainer(id: string): any {
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
    findUnit(id: string): cxUnit | null {
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
    findUnitByName(name: string): cxUnit | null {
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
    findUnitCategory(id: string): cxUnitCategory | null {
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
    findViewStyle(id: string): cxViewStyle | null {
        let vstyles = this.getViewStyles();
        if (!vstyles) return null;
        let i = 0;
        let vstyle = null;
        for (i = 0; i < vstyles.length; i++) {
            vstyle = vstyles[i];
            if (vstyle.isDeleted()) continue;
            if (vstyle.id === id)
                return vstyle;
        }
        return null;
    }
    findViewStyleByName(name: string): cxViewStyle | null {
        let vstyles = this.getViewStyles();
        if (!vstyles) return null;
        let i = 0;
        let vstyle = null;
        while (i < vstyles.length) {
            vstyle = vstyles[i];
            let name = vstyle.getName();
            if (name.toLowerCase() === name.toLowerCase())
                return vstyle;
            i++;
        }
        return null;
    }
    findGeometry(id: string): cxGeometry | null {
        let geos = this.getGeometries();
        if (!geos) return null;
        let i = 0;
        let geo = null;
        for (i = 0; i < geos.length; i++) {
            geo = geos[i];
            if (geo.isDeleted()) continue;
            if (geo.id === id)
                return geo;
        }
        return null;
    }
    findGeometryByName(name: string): cxViewStyle | null {
        let geos = this.getGeometries();
        if (!geos) return null;
        let i = 0;
        let geo = null;
        while (i < geos.length) {
            geo = geos[i];
            let name = geo.getName();
            if (name.toLowerCase() === name.toLowerCase())
                return geo;
            i++;
        }
        return null;
    }
    setIsEKA(flag: boolean) {
        this.isEKA = flag;
    }
    getIsEKA(): boolean {
        return this.isEKA;
    }
    setLayout(layout: string) {
        this.layout = layout;
    }
    getLayout(): string {
        return this.layout;
    }
    setRouting(routing: string) {
        this.routing = routing;
    }
    getRouting(): string {
        return this.routing;
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
    attributes: cxAttribute[] | null;
    methods: cxMethod[] | null;
    queries: any;
    typeview: cxObjectTypeView | cxRelationshipTypeView | null;
    viewkind: string;
    relshipkind: string;
    defaultValueset: any;
    // Constructor
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.abstract = false;
        this.supertypes = [];
        this.fs_collection = "types"; // Firestore collection
        this.properties = [];
        this.attributes = [];
        this.typeview = null; // Default typeview
        this.viewkind = "";
        this.relshipkind = "";
        this.defaultValueset = null;    // Meant to store default property values
        this.methods = [];
        this.queries = [];
    }
    // Methods
    addSupertype(type: cxType) {
        // Check if input is of correct category and not already in list (TBD)
        if (type.category === constants.gojs.C_OBJECTTYPE ||
            type.category === constants.gojs.C_RELSHIPTYPE)
        {
            if (!this.supertypes)
                this.supertypes = new Array();
            for (let i=0; i<this.supertypes.length; i++) {
                const stype = this.supertypes[i];
                if (stype.id === type.id)
                    return;
            }
            this.supertypes.push(type);
        }
    }
    addProperty(prop: cxProperty) {
        if (!prop) return;
        if (prop.category === constants.gojs.C_PROPERTY) {
            const props = new Array();
            const len = this.properties?.length;
            if (!len) {
                // New property
                props.push(prop);
            } else {
                let found = false;
                for (let i=0; i<len; i++) {
                    const p = this.properties[i];
                    if (!p) continue;
                    if (p.id === prop.id) {
                        props.push(prop);
                        found = true;
                    } else
                        props.push(p);
                    }
                if (!found) {
                    props.push(prop);
                }
            }
            this.properties = props;
        }
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
    addAttribute(attr: cxAttribute) {
        if (attr) {
            this.attributes.push(attr);       
        } 
    }
    addAttribute2(prop: cxProperty) {
        const attr = new cxAttribute(this, prop);
        if (attr)
            this.attributes.push(attr);
    }
    addMethod(mtd: cxMethod) {
        if (!mtd) return;
        if (mtd.category === constants.gojs.C_METHOD) {
            const mtds = new Array();
            const len = this.methods?.length;
            if (!len)
                mtds.push(mtd);
            else {
                let found = false;
                for (let i=0; i<len; i++) {
                    const m = this.methods[i];
                    if (!m) continue;
                    if (m.id === mtd.id) {
                        mtds.push(mtd);
                        found = true;
                    } else
                        mtds.push(m);
                }
                if (!found)
                    mtds.push(mtd);
            }
            this.methods = mtds;
        }
    }
    addQuery(query: any) {
        // To be defined
    }
    findAttributeByProperty(propRef) {
        const attrs = this.attributes;
        for (let i=0; i<attrs.length; i++) {
            const attr = attrs[i];
            if (attr.propRef === propRef) {
                return attr;
            }
        }
        return null;
    }
    findProperty(propid: string): cxProperty | null {
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
    findPropertyByName(propname: string): cxProperty | null {
        let properties = this.properties;
        if (!properties) {
            return null;
        } else {
            const noProperties = properties.length;
            let i = 0;
            while (i < noProperties) {
                if (properties[i]?.name === propname)
                    return properties[i];
                i++;
            }
            return null;
        }
    }
    findPropertyByName2(propname: string, includeInherited: boolean): cxProperty | null {
        if (debug) console.log('3488 propname, this', propname, this);
        let properties = this.properties;
        if (properties) {
            const noProperties = properties.length;
            let i = 0; 
            while (i < noProperties) {
                if (properties[i].name === propname)
                    return properties[i];
                i++;
            }
        }
        if (includeInherited) {
            if (debug) console.log('3501 supertypes', this.supertypes);
            if (this.supertypes) {
                const noSupertypes = this.supertypes.length;
                for (let i=0; i<noSupertypes; i++) {
                    const supertype = this.supertypes[i];
                    if (debug) console.log('3490 supertype', supertype);
                    if (supertype) {
                        let superprops = supertype.properties;
                        for (let j=0; j<superprops?.length; j++) {
                            const sprop = superprops[j];
                            if (sprop) {
                                if (sprop.name === propname)
                                    return sprop;
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
    findMethod(mtdid: string): cxMethod | null {
        let methods = this.methods;
        if (!methods)
            return null;
        const noMethods = methods.length;
        let i = 0;
        while (i < noMethods) {
            if (methods[i].id === mtdid)
                return methods[i];
            i++;
        }
        return null;
    }
    findMethodByName(mtdname: string): cxMethod | null {
        let methods = this.methods;
        if (!methods) {
            return null;
        } else {
            const noProperties = methods.length;
            let i = 0;
            while (i < noProperties) {
                if (methods[i]?.name === mtdname)
                    return methods[i];
                i++;
            }
            return null;
        }
    }
    findMethodByName2(mtdname: string, includeInherited: boolean): cxMethod | null {
        if (debug) console.log('3740 propname, this', mtdname, this);
        let methods = this.methods;
        if (methods) {
            const noMethods = methods.length;
            let i = 0; 
            while (i < noMethods) {
                if (methods[i].name === mtdname)
                    return methods[i];
                i++;
            }
        }
        if (includeInherited) {
            if (debug) console.log('3753 supertypes', this.supertypes);
            if (this.supertypes) {
                const noSupertypes = this.supertypes.length;
                for (let i=0; i<noSupertypes; i++) {
                    const supertype = this.supertypes[i];
                    if (debug) console.log('3758 supertype', supertype);
                    if (supertype) {
                        let supermtds = supertype.methods;
                        for (let j=0; j<supermtds?.length; j++) {
                            const smtd = supermtds[j];
                            if (smtd) {
                                if (smtd.name === mtdname)
                                    return smtd;
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
    getViewKind(): string {
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
    getRelshipKind(): string {
        if (utils.objExists(this.relshipkind))
            return this.relshipkind;
        else
            return constants.relkinds.REL;
    }
    getSupertypes(): any | null {
        return this.supertypes;
    }
    getProperties(includeInherited: boolean): cxProperty[] | null  {
        if (!includeInherited)
            return this.properties;
        const props = this.properties;
        if (includeInherited) {
            if (debug) console.log('3485 superprops', this.supertypes);
            if (this.supertypes) {
                const noSupertypes = this.supertypes.length;
                for (let i=0; i<noSupertypes; i++) {
                    const supertype = this.supertypes[i];
                    if (debug) console.log('3490 supertype', supertype);
                    if (supertype) {
                        let superprops = supertype.properties;
                        for (let j=0; j<superprops?.length; j++) {
                            const sprop = superprops[j];
                            if (sprop) {
                                let found = false;
                                for (let k=0; k<props.length; k++) {
                                    const p = props[k];
                                    if (p && p.id === sprop.id) {
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found)
                                    this.properties.push(sprop);
                            }
                        }
                    }
                }
            }
            this.removeDuplicateProperties();
        }
        if (debug) console.log('3505 properties', this.properties);
        return this.properties;
    }
    hasProperties() {
        if (!utils.objExists(this.properties))
            return false;
        else if (utils.isArrayEmpty(this.properties))
            return false;
        else
            return true;
    }
    getPointerProperties(includeInherited: boolean): cxProperty[] | null  {
        let props = this.getProperties(includeInherited);
        if (!props)
            return props;
        let props2: cxProperty[] = [];
        for (let i=0; i<props.length; i++) {
            const prop = props[i];
            if (prop) {
                if (prop.isPointerProperty())
                    props2.push(prop);
            }
        }
        return props2;
    }

    getAttributes() {
        return this.attributes;
    }
    getMethods(): any[] | null {
        return this.methods;
    }
    hasMethods() {
        return !utils.isArrayEmpty(this.methods);
    }
    getQueries(): any[] | null {
        return this.queries;
    }
    hasQueries() {
        return !utils.isArrayEmpty(this.queries);
    }
    setAbstract(abstract: boolean) {
        this.abstract = abstract;
    }
    getAbstract(): boolean {
        if (utils.objExists(this.abstract))
            return this.abstract;
        else
            return false;
    }
    clearAbstract() {
        this.abstract = false;
    }
    isAbstract(): boolean {
        return this.getAbstract();
    }
    setDefaultValueset(valset: any) {
        this.defaultValueset = valset;
    }
    getDefaultTypeView(): cxObjectTypeView | cxRelationshipTypeView | null {
        return this.typeview;
    }
    getDefaultValueset(): any {
        return this.defaultValueset;
    }
    removeDuplicateProperties() {
        const props = [];
        const props1 = this.properties;
        const props2 = this.properties;
        for (let i=0; i<props1?.length; i++) {
            const p1 = props1[i];
            for (let j=0; j<props2.length; j++) {
                const p2 = props2[j];
                if (p1 && p2) {
                    if (p1.name === p2.name) {
                        if (p1.id !== p2.id)
                            break;
                        props.push(p1);
                        break;
                    }
                }
            }
        }
        if (debug) console.log('3893 this.properties, props', this.properties, props);
        this.properties = props;
    }
    isOfType(typeName: string): boolean {
        let retval = false;
        if (this.name === typeName) { 
            return true;
        }
        const stypes = this.supertypes;
        for (let i=0; i<stypes?.length; i++) {
            const stype = stypes[i];
            if (stype?.name === typeName)
                return true;
        }
        return retval;
    }
}

export class cxObjectType extends cxType {
    typeid: string;
    fromObjtype: cxObjectType | null;
    toObjtype: cxObjectType | null;
    objtypegeos: cxObjtypeGeo[] | null;
    inputreltypes: cxRelationshipType[] | null;
    outputreltypes: cxRelationshipType[] | null;
    allObjecttypes: cxObjectType [] | null;
    allRelationshiptypes: cxRelationshipType [] | null;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_OBJECTTYPES;  // Firestore collection
        this.category = constants.gojs.C_OBJECTTYPE;
        this.typeid = constants.types.OBJECTTYPE_ID;
        this.viewkind = constants.viewkinds.OBJ;
        this.relshipkind = "";
        this.fromObjtype = null;
        this.toObjtype = null;
        this.objtypegeos = null;
        this.inputreltypes = null;
        this.outputreltypes = null;
        this.allObjecttypes = null;
        this.allRelationshiptypes = null;
        this.markedAsDeleted = false;
        if (debug) console.log('3268 this', this);
    }

    // Methods
    
    addInputreltype(reltype: cxRelationshipType) {
        if (!this.inputreltypes)
            this.inputreltypes = new Array();
        const len = this.inputreltypes.length;
        for (let i=0; i<len; i++) {
            const rtype = this.inputreltypes[i];
            if (rtype.id === reltype.id) {
                // Relationship type is already in list
                return;
            }
        }
        this.inputreltypes.push(reltype);
    }
    removeInputreltype(reltype: cxRelationshipType) {
        if (!this.inputreltypes)
            return;
        const reltypes = new Array();
        const len = this.inputreltypes.length;
        for (let i=0; i<len; i++) {
            const rtype = this.inputreltypes[i];
            if (rtype.id !== reltype.id) {
                reltypes.push(reltype);
            }
        }
        this.inputreltypes = reltypes;
    }
    addOutputreltype(reltype: cxRelationshipType) {
        if (!this.outputreltypes)
            this.outputreltypes = new Array();
        const len = this.outputreltypes.length;
        for (let i=0; i<len; i++) {
            const rtype = this.outputreltypes[i];
            if (rtype.id === reltype.id) {
                // Relationship type is already in list
                return;
            }
        }
        this.outputreltypes.push(reltype);
    }
    removeOutputreltype(reltype: cxRelationshipType) {
        if (!this.outputreltypes)
            return;
        const reltypes = new Array();
        const len = this.outputreltypes.length;
        for (let i=0; i<len; i++) {
            const rtype = this.outputreltypes[i];
            if (rtype.id !== reltype.id) {
                reltypes.push(rtype);
            }
        }
        this.outputreltypes = reltypes;
    }
    getOutputReltypes(kind: string): cxRelationshipType[] | null {
        if (!this.outputreltypes)
            return null;
        const reltypes = new Array();
        const len = this.outputreltypes.length;
        for (let i=0; i<len; i++) {
            const rtype = this.outputreltypes[i];
            if (rtype.relshipkind === kind) {
                reltypes.push(rtype);
            }
        }
        return reltypes;
    }
    getLoc(metamodel: cxMetaModel): string {
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
    getSize(metamodel: cxMetaModel): string {
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
    getObjtypeGeos(): cxObjtypeGeo[] | null {
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
    getTypeId(): string {
        return this.typeid;
    }
    getDefaultTypeView(): cxObjectTypeView | cxRelationshipTypeView | null {
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
    isInstantiable(): boolean {
        let retval = true;
        if (this.markedAsDeleted)
            retval = false;
        else if (this.abstract)
            retval = false;
        return retval;
    }
    getViewKind(): string {
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
    getRelshipKind(): string {
        if (utils.objExists(this.relshipkind))
            return this.relshipkind;
        else
            return constants.relkinds.REL;
    }
    setFromObjtype(fromObjtype: cxObjectType) {
        this.fromObjtype = fromObjtype;
    }
    getFromObjType(): cxObjectType | null {
        return this.fromObjtype;
    }
    setToObjtype(toObjtype: cxObjectType) {
        this.toObjtype = toObjtype;
    }
    getToObjType(): cxObjectType | null {
        return this.toObjtype;
    }
    setAllObjecttypes(objtypes: cxObjectType[]) {
        this.allObjecttypes = objtypes;
    }
    getAllObjecttypes(): cxObjectType[] | null {
        return this.allObjecttypes;
    }
    setAllRelationshiptypes(reltypes: cxRelationshipType[]) {
        this.allRelationshiptypes = reltypes;
    }
    getAllRelationshiptypes(): cxRelationshipType[] | null {
        return this.allRelationshiptypes;
    }
    isContainer(): boolean {
        if (this.viewkind == constants.viewkinds.CONT)
            return true;
        return false;
    }
    findRelatedObjectTypes(relkind: string): cxObjectType[] | null {
        const objtypes = new Array();
        const types = this.allRelationshiptypes;
        if (debug) console.log('3414 allReltypes', types);
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
                            if (debug) console.log('3426 reltype', fromType.name);
                            if (reltype.getFromObjType().id === this.id) {
                                const toType = reltype.getToObjType();
                                if (debug) console.log('3429 reltype', toType.name);
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
    findSupertypes(level: number): cxObjectType[] | null {
        if (!level) level = 0;
        const supertypes = new Array();
        const rtypes = this.outputreltypes;
        if (debug) console.log('5005 this, rtypes', this, rtypes);
        if (rtypes) {
            for (let i=0; i<rtypes?.length; i++) {
                const rtype = rtypes[i];
                if (rtype?.relshipkind === constants.relkinds.GEN) {
                    const stype = rtype.toObjtype;
                    if (stype) {
                        supertypes.push(stype);
                        if (level > 5) 
                            return supertypes;
                        if (debug) console.log('5015 this, supertypes', this, supertypes);
                        const stypes = stype.findSupertypes(++level);
                        if (stypes) {
                            for (let j=0; j<stypes.length; j++) {
                                const stype = stypes[j];
                                supertypes.push(stype);
                            }
                            if (debug) console.log('5022 this, supertype', this, supertypes);
                        }
                    }
                }
            }
        }
        return supertypes;
    }
    inherits(type: cxObjectType, allReltypes: cxRelationshipType[]): boolean {   
        // Check if this (objecttype) inherits from type
        if (debug) console.log('3781 this.name, type.name', this.name, type.name);
        let retval = false;
        this.allRelationshiptypes = allReltypes;
        if (this.id === type.id) {
            return true;
        } else {
            const types = this.findRelatedObjectTypes(constants.relkinds.GEN);
            if (debug) console.log('3788 this, objtypes', this, types);
            if (types) {
                for (let i = 0; i < types.length; i++) {
                    if (debug) console.log('3791 this, objtype', this, type);
                    const supertype = types[i];
                    if (supertype) {
                        if (this.id === supertype.id)
                            continue;
                        if (supertype.id === type.id) {
                            if (debug) console.log('3795 Found supertype', supertype.name);
                            return true;
                        } else {
                            if (debug) console.log('3798 find supertype of', supertype, type);
                            retval = supertype.inherits(type, allReltypes);
                            if (retval)
                                return true;
                        }
                    }
                }
            }
        }
        return retval;
    }
    findRelshipTypeByKind(relkind: string, objtype: cxObjectType): cxRelationshipType | null {                           // .COMP
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
    findRelshipTypeByKind3(relkind: string, objtype: cxObjectType): cxRelationshipType | null {
        // Check if this has a relationship to a super of objtype
        const rkind: string = constants.relkinds.GEN;
        const stypes = this.findRelatedObjectTypes(rkind);                // Finds supertype
        if (stypes && stypes.length > 0) {
            for (let j = 0; j < stypes.length; j++) {
                const stype = stypes[j];      // Supertype of objtype
                let rtype = stype.findRelshipTypeByKind1(relkind, objtype, null);     // Supertype is .COMP ?
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
    numberOfMetamodelsUsage(metis: cxMetis): number {
        let count = 0;
        const metamodels = metis.metamodels;
        for (let i=0; i<metamodels.length; i++) {
            const mm = metamodels[i];
            const objtypes = mm.objecttypes;
            for (let j=0; j<objtypes.length; j++) {
                const otype = objtypes[j];
                if (otype.id === this.id) {
                    count++;
                    break;
                }
            }
        }
        return count;
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
        this.fs_collection = "objtypegeos";  // Firestore collection
        this.category = "Object type geo";
        this.metamodel = metamodel;
        this.metamodelRef = "";
        this.type = type;
        this.loc = loc === undefined ? "" : loc;
        this.size = size === undefined ? "" : size;
    }
    getMetamodel(): cxMetaModel | null {
        return this.metamodel;
    }
    setMetamodel(metamodel: cxMetaModel) {
        if (utils.objExists(metamodel)) {
            this.metamodel = metamodel;
        }
    }
    getType(): cxObjectType | null {
        return this.type;
    }
    setType(type: cxObjectType) {
        if (type) {
            this.type = type;
        }
    }
    getLoc(): string{
        return this.loc;
    }
    setLoc(loc: string) {
        this.loc = loc;
    }
    getSize(): string {
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
    fromobjtypeRef: string;
    toobjtypeRef: string;
    relshipkind: string;
    viewkind: string;
    cardinality: string;
    cardinalityFrom: string;
    cardinalityTo: string;
    nameFrom: string;
    nameTo: string;
    constructor(id: string, name: string, fromObjtype: cxObjectType | null, toObjtype: cxObjectType | null, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_RELSHIPTYPES;     // Firestore collection
        this.category = constants.gojs.C_RELSHIPTYPE;
        this.typeid = constants.types.RELATIONSHIPTYPE_ID;
        this.fromObjtype = fromObjtype;
        this.fromobjtypeRef = fromObjtype?.id;
        this.toObjtype = toObjtype;
        this.toobjtypeRef = toObjtype?.id;
        this.relshipkind = constants.relkinds.REL;
        this.viewkind = "";
        this.cardinality = "";
        this.cardinalityFrom = "";
        this.nameTo = "";
        this.nameFrom = "";
        this.cardinalityTo = "";
        this.markedAsDeleted = false;
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
    getDefaultTypeView(): cxRelationshipTypeView | null {
        return this.typeview as cxRelationshipTypeView;
    }
    setCardinality(cardinality: string) {
        // Check if valid format
        if (true)
            this.cardinality = cardinality; 
    }
    getCardinality() : string {
        let retval = this.cardinality;
        return retval;
    }
    getCardinalityFrom(): string {
        let retval = this.cardinalityFrom;
        return retval;
    }
    getCardinalityTo(): string {
        let retval = this.cardinalityTo;
        return retval;
    }
    setNameFrom(name: string) {
        this.nameFrom = name;
    }
    getNameFrom(): string {
        return this.nameFrom;
    }
    setNameTo(name: string) {
        this.nameTo = name;
    }
    getNameTo(): string {
        return this.nameTo;
    }
    isInstantiable(): boolean {
        let retval = true;
        if (this.markedAsDeleted)
            retval = false;
        else if (this.abstract)
            retval = false;
        return retval;
    }
    isAllowedFromType(objtype: cxObjectType, allObjtypes: cxObjectType[], allReltypes: cxRelationshipType[]): boolean {
        if (objtype && this.fromObjtype) {
            if (debug) console.log('3666 objtype', objtype.name, this.fromObjtype.name);
            if (objtype.inherits(this.fromObjtype, allReltypes)) {
                if (debug) console.log('3668 inherits, true');
                    return true;
            }
        }
        return false;
    }
    isAllowedToType(objtype: cxObjectType, allObjtypes: cxObjectType[], allReltypes: cxRelationshipType[]): boolean {
        if (objtype && this.toObjtype) {
            if (debug) console.log('3340 objtype', objtype.name, this.toObjtype.name);
            if (objtype.inherits(this.toObjtype, allReltypes))
                return true;
        }
        return false;
    }
    setFromObjectType(objtype: cxObjectType) {
        this.fromObjtype = objtype;
        this.fromobjtypeRef = objtype.id;
    }
    setToObjectType(objtype: cxObjectType) {
        this.toObjtype = objtype;
        this.toobjtypeRef = objtype.id;
    }
    numberOfMetamodelsUsage(metis: cxMetis): number {
        let count = 0;
        const metamodels = metis.metamodels;
        for (let i=0; i<metamodels.length; i++) {
            const mm = metamodels[i];
            const reltypes = mm.relshiptypes;
            for (let j=0; j<reltypes.length; j++) {
                const rtype = reltypes[j];
                if (rtype.id === this.id) {
                    count++;
                    break;
                }
            }
        }
        return count;
    }
}

export class cxProperty extends cxMetaObject {
    datatype:       cxDatatype | null;
    datatypeRef:    string;
    method:         cxMethod | null;
    methodRef:      string;
    unitCategory:   cxUnitCategory | null;
    unitCategoryRef: string;
    defaultValue:   string;
    inputPattern:   string;
    viewFormat:     string;
    example:        string;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.fs_collection      = constants.fs.FS_C_PROPERTIES;  // Firestore collection
        this.category           = constants.gojs.C_PROPERTY;
        this.datatype           = null;
        this.datatypeRef        = "";            // Neccessary ???
        this.method             = null;
        this.methodRef          = "";
        this.unitCategory       = null;
        this.unitCategoryRef    = "";
        this.defaultValue       = "";
        this.inputPattern       = "";
        this.viewFormat         = "";
        this.example            = "";
    }
    // Methods
    setDatatype(datatype: cxDatatype) {
        this.datatype = datatype;
    }
    getDatatype(): cxDatatype | null {
        if (this.datatype)
            return this.datatype;
        else
            return null;
    }
    setMethod(method: cxMethod) {
        this.method = method;
    }
    getMethod(): cxMethod | null {
        if (this.method)
            return this.method;
        else
            return null;
    }
    setUnitCategory(cat: cxUnitCategory) {
        this.unitCategory = cat;
    }
    getUnitCategory(): cxUnitCategory | null {
        if (utils.objExists(this.unitCategory))
            return this.unitCategory;
        else
            return null;
    }
    // defaultValue is not an object, but a value
    setDefaultValue(value: string) {
        this.defaultValue = value;
    }
    getDefaultValue(): string {
        if (utils.objExists(this.defaultValue))
            return this.defaultValue;
        else
            return "";
    }
    isPointerProperty(): boolean {
        const dtype = this.getDatatype();
        if (dtype?.getPointerType())
            return true;
        else
            return false;
    }
}

export class cxAttribute {
    name:       string;
    typeName:   string;
    propName:   string;
    propRef:    string;     // Property id
    constructor(type: cxType, prop: cxProperty) {
        if (prop && type) {
            this.typeName = type.name;
            this.propName = prop.name;
            this.name     = this.typeName + '.' + this.propName;
            this.propRef  = prop.id;
        }
    }
}

export class cxMethod extends cxMetaObject {
    methodtype:     string;
    expression:     string;
    allProperties:  cxProperty[] | null;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.category   = constants.gojs.C_METHOD;
        this.methodtype = constants.types.MTD_CALCULATEVALUE;
        this.expression = "";
        this.allProperties = null;
    }
    setAllProperties(allprops: cxProperty[]) {
        this.allProperties = allprops;
    }
    getAllProperties(): cxProperty[] | null {
        return this.allProperties;
    }
    evaluateExpression(expr: string): any {
        const pi = 3.14159265;
        if (expr.length>0) {
            return eval(expr);
        }
    }
}

// ---------  View Template Definitions  -----------------------------
export class cxViewStyle extends cxMetaObject {
    objecttypeviews: cxObjectTypeView[] | null;
    relshiptypeviews:   cxRelationshipTypeView[] | null = null;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.category = constants.gojs.C_VIEWSTYLE;
        this.objecttypeviews  = null;
        this.relshiptypeviews = null;
    }
    addObjectTypeView(objtypeView: cxObjectTypeView) {
        // Check if input is of correct category and not already in list (TBD)
        if (objtypeView.category === constants.gojs.C_OBJECTTYPEVIEW) {
            if (this.objecttypeviews == null)
                this.objecttypeviews = new Array();
            if (!this.findObjectTypeView(objtypeView.id))
                this.objecttypeviews.push(objtypeView);
        }
    }
    findObjectTypeView(id: string): cxObjectTypeView | null {
        const typeviews = this.objecttypeviews;
        if (!typeviews) return null;
        let tview = null;
        for (let i = 0; i < typeviews.length; i++) {
            tview = typeviews[i];
            if (tview.id === id)
                return tview;
        }
        return null;
    }
    addRelationshipTypeView(reltypeView: cxRelationshipTypeView) {
        // Check if input is of correct category and not already in list (TBD)
        if (reltypeView.category === constants.gojs.C_RELSHIPTYPEVIEW) {
            if (this.relshiptypeviews == null)
                this.relshiptypeviews = new Array();
            if (!this.findRelationshipTypeView(reltypeView.id))
                this.relshiptypeviews.push(reltypeView);
        }
    }
    findRelationshipTypeView(id: string): cxObjectTypeView | null {
        const typeviews = this.relshiptypeviews;
        if (!typeviews) return null;
        let tview = null;
        for (let i = 0; i < typeviews.length; i++) {
            tview = typeviews[i];
            if (tview.id === id)
                return tview;
        }
        return null;
    }
}

export class cxObjtypeviewData {
    abstract: boolean;
    arrowscale: string;
    memberscale: string;
    viewkind: string;
    template: string;
    figure: string;
    geometry: string;
    fillcolor: string;
    fillcolor2: string;
    strokecolor: string;
    strokecolor2: string;
    strokewidth: string;
    textcolor: string;
    textscale: string;
    icon: string;
    constructor() {
        this.abstract = false;
        this.memberscale = "1";
        this.arrowscale = "1.3";
        this.viewkind = constants.viewkinds.OBJ;
        this.template = "textAndIcon";
        this.figure = "";
        this.geometry = "";
        this.fillcolor = "";
        this.fillcolor2 = "";
        this.strokecolor = "black";
        this.strokecolor2 = "black";
        this.strokewidth = "1";
        this.textcolor = "black";
        this.textscale = "1";
        this.icon = "";
    }
}

export class cxObjectTypeView extends cxMetaObject {
    // type: cxObjectType | null;
    typeRef: string;
    data: cxObjtypeviewData;
    template: string;
    figure: string;
    arrowscale: string;
    memberscale: string;
    geometry: string;
    fillcolor: string;
    fillcolor2: string;
    strokecolor: string;
    strokecolor2: string;
    strokewidth: string;
    textcolor: string;
    textscale: string;
    viewkind: string;
    icon: string;
    constructor(id: string, name: string, type: cxObjectType | null, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_OBJECTTYPEVIEWS;  // Firestore collection
        this.category    = constants.gojs.C_OBJECTTYPEVIEW;
        // this.type        = type;
        this.typeRef     = type?.id;
        this.template    = "";
        this.figure      = "";
        this.geometry    = "";
        this.arrowscale  = "";
        this.memberscale = "";
        this.fillcolor   = "";
        this.fillcolor2   = "";
        this.strokecolor = "";
        this.strokecolor2 = "";
        this.strokewidth = "";
        this.textcolor   = "";
        this.textscale   = "";
        this.viewkind    = "";
        this.icon        = "";
        this.data        = new cxObjtypeviewData();
        if (type) {
            const abs = type.abstract;
            if (abs) this.data.abstract = abs;
        }
    }
    // Methods
    applyObjectViewParameters(objview: cxObjectView) {
        if (objview) {
            let prop: any;
            let data: any = this.data;
            for (prop in data) {
                if (objview[prop] == undefined || objview[prop] === "") continue;
                if (prop === 'arrowscale')      data[prop] = objview[prop];
                if (prop === 'memberscale')     data[prop] = objview[prop];
                if (prop === 'template')        data[prop] = objview[prop];
                if (prop === 'geometry')        data[prop] = objview[prop];
                if (prop === 'figure')          data[prop] = objview[prop];
                if (prop === 'fillcolor')       data[prop] = objview[prop];
                if (prop === 'fillcolor2')       data[prop] = objview[prop];
                if (prop === 'strokecolor')     data[prop] = objview[prop];
                if (prop === 'strokecolor2')     data[prop] = objview[prop];
                if (prop === 'strokewidth')     data[prop] = objview[prop];
                if (prop === 'icon')            data[prop] = objview[prop];
            }
            if (debug) console.log('5580 data', data,);
            for (prop in data) {
                this[prop] = data[prop];
            }
            if (debug) console.log('5584 this', this);           
        }
    }
    setType(type: cxObjectType) {
        // this.type = type;
        this.typeRef = type?.id;
    }
    // getType(): cxObjectType | null {
    //     if (this.type)
    //         return this.type;
    //     return null;
    // }
    getTypeRef(): string {
        return this.typeRef;
    }
    setData(data: any) {
        // If is valid JSON
        this.data = data;
    }
    getData(): any {
        return this.data;
    }
    setViewKind(viewkind: string) {
        this.data.viewkind = viewkind;
        // this.setIsGroup(viewkind);
    }
    getViewKind(): string {
        if (utils.objExists(this.data.viewkind))
            return this.data.viewkind;
        else
            return constants.viewkinds.OBJ;
    }
    setAbstract(abstract: boolean) {
        this.data.abstract = abstract;
    }
    getAbstract(): boolean {
        return this.data.abstract;
    }
    // setIsGroup1(flag: boolean) {
    //     this.data.isGroup = flag;
    // }
    // setIsGroup(viewkind: string) {
    //     if (viewkind == constants.viewkinds.CONT) {
    //         this.data.isGroup = true;
    //     } else
    //         this.data.isGroup = false;
    // }
    // getIsGroup(): boolean {
    //     if (utils.objExists(this.data.isGroup))
    //         return this.data.isGroup;
    //     else
    //         return false;
    // }
    // getIsContainer(): boolean {
    //     return this.getIsGroup();
    // }
    // setGroup(group: string) {
    //     this.data.group = group;
    // }
    // getGroup(): string {
    //     return this.data.group;
    // }
    setTemplate(template: string) {
        this.data.template = template;
        this.template = template;
    }
    getTemplate(): string {
        if (this.data.template)
            return this.data.template;
        else if (this.template)
            return this.template;
        return "";
    }
    setFigure(figure: string) {
        this.data.figure = figure;
        this.figure = figure;
    }
    getFigure(): string {
        if (this.data.figure)
            return this.data.figure;
        else if (this.figure)
            return this.figure;
        return "";
    }
    setGeometry(geometry: string) {
        this.data.geometry = geometry;
        this.geometry = geometry;
    }
    getGeometry(): string {
        if (this.data.geometry)
            return this.data.geometry;
        else if (this.geometry)
            return this.geometry;
        return "";
    }
    setFillcolor(fillcolor: string) {
        this.data.fillcolor = fillcolor;
        this.fillcolor = fillcolor;
    }
    getFillcolor(): string {
        if (this.data.fillcolor)
            return this.data.fillcolor;
        else if (this.fillcolor)
            return this.fillcolor;
        return "white";
    }
    setFillcolor2(fillcolor: string) {
        this.data.fillcolor2 = fillcolor;
        this.fillcolor2 = fillcolor;
    }
    getFillcolor2(): string {
        if (this.data.fillcolor2)
            return this.data.fillcolor2;
        else if (this.fillcolor2)
            return this.fillcolor2;
        return "white";
    }
    setTextcolor(color: string) {
        this.data.textcolor = color;
        this.textcolor = color;
    }
    getTextcolor(): string {
        if (this.data.textcolor)
            return this.data.textcolor;
        else if (this.textcolor)
            return this.textcolor;
        return "black";
    }
    setTextscale(scale: string) {
        this.data.textscale = scale;
        this.textscale = scale;
    }
    getTextscale(): string {
        if (this.data.textscale)
            return this.data.textscale;
        else if (this.textscale)
            return this.textscale;
        return "1";
    }
    setStrokecolor(strokecolor: string) {
        this.data.strokecolor = strokecolor;
        this.strokecolor = strokecolor;
    }
    getStrokecolor(): string {
        if (this.data.strokecolor)
            return this.data.strokecolor;
        else if (this.strokecolor)
            return this.strokecolor;
        return "black";
    }
    setStrokecolor2(strokecolor: string) {
        this.data.strokecolor2 = strokecolor;
        this.strokecolor2 = strokecolor;
    }
    getStrokecolor2(): string {
        if (this.data.strokecolor2)
            return this.data.strokecolor2;
        else if (this.strokecolor2)
            return this.strokecolor2;
        return "black";
    }
    setStrokewidth(strokewidth: string) {
        this.strokewidth = strokewidth;
        this.data.strokewidth = strokewidth;
    }
    getStrokewidth(): string {
        if (this.data.strokewidth)
            return this.data.strokewidth;
        else if (this.strokewidth)
            return this.strokewidth;
        return "2";
    }
    setMemberscale(memberscale: string) {
        this.memberscale = memberscale;
        this.data.memberscale = memberscale;
    }
    getMemberscale(): string {
        if (this.data.memberscale)
            return this.data.memberscale;
        else if (this.memberscale)
            return this.memberscale;
        return "1"; // Default  1
    }
    // setTextscale(textscale: string) {
    //     this.textscale = textscale;
    //     this.data.textscale = textscale;
    // }
    // getTextscale(): string {
    //     if (this.data.textscale)
    //         return this.data.textscale;
    //     else if (this.textscale)
    //         return this.textscale;
    //     return "1"; // Default  1
    // }
    setArrowscale(arrowscale: string) {
        this.arrowscale = arrowscale;
        this.data.arrowscale = arrowscale;
    }
    getArrowscale(): string {
        if (this.data.arrowscale)
            return this.data.arrowscale;
        else if (this.arrowscale)
            return this.arrowscale;
        return "1.3"; // Default  1
    }
    setIcon(icon: string) { 
        this.data.icon = icon;
        this.icon = icon;
    }
    getIcon(): string {
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
    template:       string;
    strokecolor:    string;
    strokewidth:    string;
    textcolor:      string;
    arrowscale:     string;
    textscale:      string;
    dash:           string;
    fromArrow:      string;
    toArrow:        string;
    fromArrowColor: string;
    toArrowColor:   string;
    constructor() {
        this.abstract       = false;
        this.relshipkind    = constants.relkinds.REL;
        this.template       = "linkTemplate1";
        this.strokecolor    = "black";
        this.strokewidth    = "1";
        this.textcolor      = "black";
        this.arrowscale     = "1.3";
        this.textscale      = "1";
        this.dash           = "None";
        this.fromArrow      = "";
        this.toArrow        = "OpenTriangle";
        this.fromArrowColor = "";
        this.toArrowColor   = "white";
    }
}

export class cxRelationshipTypeView extends cxMetaObject {
    // type:           cxRelationshipType | null;
    typeRef:        string;
    data:           cxReltypeviewData;
    template:       string;
    strokecolor:    string;
    strokewidth:    string;
    textcolor:      string;
    dash:           string;
    textscale:      string;
    arrowscale:     string;
    fromArrow:      string;
    toArrow:        string;
    fromArrowColor: string;
    toArrowColor:   string;
    constructor(id: string, name: string, type: cxRelationshipType | null, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_RELSHIPTYPEVIEWS;  // Firestore collection
        this.category = constants.gojs.C_RELSHIPTYPEVIEW;
        // this.type     = type;
        this.typeRef  = type?.id;
        this.data     = new cxReltypeviewData();
        for (let prop in this.data) {
            this[prop] = this.data[prop];
        }
        // this.template = "linkTemplate1";
        this.setFromArrow2(type?.relshipkind);
        this.setToArrow2(type?.relshipkind);
    }
    // Methods
    applyRelationshipViewParameters(relview: cxRelationshipView) {
        if (relview) {
            let prop: any;
            let data: any = this.data;
            for (prop in data) {
                if (relview[prop] == undefined || relview[prop] === "") continue;
                if (prop === 'template')       data[prop] = relview[prop];
                if (prop === 'strokecolor')    data[prop] = relview[prop];
                if (prop === 'strokewidth')    data[prop] = relview[prop];
                if (prop === 'textcolor')      data[prop] = relview[prop];
                if (prop === 'textscale')      data[prop] = relview[prop];
                if (prop === 'dash')           data[prop] = relview[prop];
                if (prop === 'fromArrow')      data[prop] = relview[prop];
                if (prop === 'toArrow')        data[prop] = relview[prop];
                if (prop === 'fromArrowColor') data[prop] = relview[prop];
                if (prop === 'toArrowColor')   data[prop] = relview[prop];
            }
            if (debug) console.log('5883 data', data);
            for (prop in data) {
                this[prop] = data[prop];
            }
            if (debug) console.log('5887 this', this);           
        }
    }
    setType(type: cxRelationshipType) {
        this.typeRef = type?.id;
        // this.type = type;
    }
    // getType(): cxRelationshipType | null {
    //     if (this.type)
    //         return this.type;
    //     return null;
    // }
    getTypeRef(): string {
        return this.typeRef;
    }
    setData(data: cxReltypeviewData) {
        // If is valid JSON
        this.data = data;
    }
    getData(): cxReltypeviewData | null {
        return this.data;
    }
    setAbstract(abstract: boolean) {
        this.data.abstract = abstract;
    }
    getAbstract(): boolean {
        return this.data.abstract;
    }
    setRelshipKind(kind: string) {
        this.data.relshipkind = kind;
        this.setFromArrow2(kind);
        this.setToArrow2(kind);
    }
    // getRelshipKind(): string {
    //     let retval = this.data.relshipkind;
    //     if (!retval) {
    //         let type = this.getTypeRef();
    //         if (type)
    //             retval = type.getRelshipKind();
    //     }
    //     return retval;
    // }
    setTemplate(template: string) {
        this.data.template = template;
        this.template = template;
    }
    getTemplate(): string {
        if (this.template)
            return this.template;
        else if (this.data.template)
            return this.data.template;
        else
            return "linkTemplate1";
    }
    setStrokecolor(strokecolor: string) {
        this.data.strokecolor = strokecolor;
        this.strokecolor = strokecolor;
    }
    getStrokecolor(): string {
        if (this.strokecolor)
            return this.strokecolor;
        else if (this.data.strokecolor)
            return this.data.strokecolor;
        else
            return "black";
    }
    setTextcolor(color: string) {
        this.data.textcolor = color;
        this.textcolor = color;
    }
    getTextcolor(): string {
        if (this.textcolor)
            return this.textcolor;
        else if (this.data.textcolor)
            return this.data.textcolor;
        else
            return "black";
    }
    setTextscale(scale: string) {
        this.data.textscale = scale;
        this.textscale = scale;
    }
    getTextscale(): string {
        if (this.textscale)
            return this.textscale;
        else if (this.data.textscale)
            return this.data.textscale;
        else
            return "1";
    }
    setStrokewidth(strokewidth: string) {
        this.data.strokewidth = strokewidth;
        this.strokewidth = strokewidth;
    }
    getStrokewidth(): string {
        if (this.strokewidth)
            return this.strokewidth;
        else if (this.data.strokewidth)
            return this.data.strokewidth;
        return "1";
    }
    setDash(dash: string) {
        this.data.dash = dash;
        this.dash = dash;
    }
    getDash(): string {
        if (this.dash)
            return this.dash;
        else if (this.data.dash)
            return this.data.dash;
        else
            return "";
    }
    setFromArrow(fromArrow: string) {
        this.data.fromArrow = fromArrow;
        this.fromArrow = fromArrow;
    }
    getFromArrow(): string {
        if (this.fromArrow)
            return this.fromArrow;
        else if (this.data.fromArrow)
            return this.data.fromArrow;
        return "";
    }
    setToArrow(toArrow: string) {
        this.data.toArrow = toArrow;
        this.toArrow = toArrow;
    }
    setFromArrow2(relshipkind: string) {
        switch (relshipkind) {
            case 'Composition':
                this.setFromArrow('StretchedDiamond');
                this.setFromArrowColor('black');
                break;
            case 'Aggregation':
                this.setFromArrow('StretchedDiamond');
                this.setFromArrowColor('white');
                break;
            case 'Generalization':
                this.setFromArrow(' ');
                this.setFromArrowColor(' ');
                break;
            default:
                break;
        }
    }
    setToArrow2(relshipkind: string) {
        switch (relshipkind) {
            case 'Generalization':
                this.setToArrow('Triangle');
                this.setToArrowColor('white');
                this.textcolor = 'black';
                break;
            default:
                break;
        }
    }
    getToArrow(): string {
        if (this.toArrow)
            return this.toArrow;
        else if (this.data.toArrow)
            return this.data.toArrow;
        return "";
    }
    setFromArrowColor(color: string) {
        this.data.fromArrowColor = color;
        this.fromArrowColor = color;
    }
    getFromArrowColor(): string {
        if (this.fromArrowColor)
            return this.fromArrowColor;
        else if (this.data.fromArrowColor)
            return this.data.fromArrowColor;
        return "";
    }
    setToArrowColor(color: string) {
        this.data.toArrowColor = color;
        this.toArrowColor = color;
    }
    getToArrowColor(): string {
        if (this.toArrowColor)
            return this.toArrowColor;
        else if (this.data.toArrowColor)
            return this.data.toArrowColor;
        return "";
    }
}

// ---------------------------------------------------------------------
export class cxModel extends cxMetaObject {
    // modeltype: string;
    metamodel: cxMetaModel | null;
    sourceMetamodelRef: string;
    targetMetamodelRef: string;
    sourceModelRef: string;
    targetModelRef: string;
    templates: cxModelView[];
    isTemplate: boolean;
    isMetamodel: boolean;
    includeSystemtypes: boolean;
    includeRelshipkind: boolean;
    layer: string;
    submodels: cxModel[] | null; 
    objects: cxObject[] | null;
    relships: cxRelationship[] | null;
    modelviews: cxModelView[] | null;
    args1: any[];
    constructor(id: string, name: string, metamodel: cxMetaModel | null, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_MODELS;  // Firestore collection
        this.category = constants.gojs.C_MODEL;
        // this.modeltype = "";
        this.metamodel = metamodel;
        this.clearContent();
    }
    clearContent() {
        this.sourceMetamodelRef = "";
        this.targetMetamodelRef = "";
        this.sourceModelRef = "";
        this.targetModelRef = "";
        this.templates = null;
        this.isTemplate = false;
        this.isMetamodel = false;
        this.includeSystemtypes = true;
        this.includeRelshipkind = false;
        this.layer = 'Foreground';
        this.submodels = null;
        this.objects = null;
        this.relships = null;
        this.modelviews = null;
        this.args1 = [];
    }
    // setModelType(modeltype: string) {
    //     this.modeltype = modeltype;
    // }
    // getModelType(): string {
    //     return this.modeltype;
    // }
    setMetamodel(metamodel: cxMetaModel) {
        this.metamodel = metamodel;
    }
    getMetamodel(): cxMetaModel | null {
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
    getTemplates(): cxModelView[] | null {
        return this.templates;
    }
    setIsTemplate(flag: boolean) {
        this.isTemplate = flag;
    }
    getIsTemplate(): boolean {
        return this.isTemplate;
    }
    setIsMetamodel(flag: boolean) {
        this.isMetamodel = flag;
    }
    getIsMetamodel(): boolean {
        return this.isMetamodel;
    }
    getModelViews(): cxModelView[] | null {
        return this.modelviews;
    }
    getObjects(): cxObject[] | null {
        return this.objects;
    }
    getObjectsByType(objtype: cxObjectType, includeSubTypes: boolean): cxObject[] | null {
        let objects = new Array();
        if (this.objects) {
            for (let i = 0; i < this.objects.length; i++) {
                let obj = this.objects[i];
                if (obj && !obj.markedAsDeleted) {
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
    getObjectsByTypename(objtypeName: string, includeSubTypes: boolean): cxObject[] | null {
        let objects = new Array();
        if (this.objects) {
            for (let i = 0; i < this.objects.length; i++) {
                let obj = this.objects[i];
                if (obj && !obj.markedAsDeleted) {
                    let type = obj.getType();
                    if (type && type.name === objtypeName)
                        objects.push(obj);
                }
            }
            if (includeSubTypes) {
                // get list of subtypes
            }
        }
        return objects;
    }
    getCopiedFromObject(fromId: string): cxObject {
        if (debug) console.log('5972 this.objects, fromId', this.objects, fromId);
        for (let i=0; i<this.objects.length; i++) {
            const obj = this.objects[i];
            if (obj.copiedFromId === fromId) {
                if (debug) console.log('5977 obj, fromId', obj, fromId);
                return obj;
            }
        }
        return null;
    }
    getRelationships(): cxRelationship[] | null {
        return this.relships;
    }
    getRelationshipsByType(reltype: cxRelationshipType, includeSubTypes: boolean): cxRelationship[] | null {
        let relships = new Array();
        if (this.relships) {
            for (let i = 0; i < this.relships.length; i++) {
                let rel = this.relships[i];
                if (rel && !rel.markedAsDeleted) {
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
    getRelationshipsByTypeName(reltypeName: string, kind: string): cxRelationship[] | null {
        let relships = new Array();
        if (this.relships) {
            for (let i = 0; i < this.relships.length; i++) {
                let rel = this.relships[i];
                if (rel.name === reltypeName && !rel.markedAsDeleted) {
                    if (rel.relshipkind === kind)
                        relships.push(rel);
                }
            }
        }
        return relships;
    }
    getSubmodels(): cxModel[] | null {
        return this.submodels;
    }
    addSubmodel(model: cxModel) {
        // Check if input is of correct category and not already in list (TBD)
        if (this.submodels == null)
            this.submodels = new Array();
        
        if (!this.findSubmodel(model.id))
            this.submodels.push(model);
    }
    addModelView(modelview: cxModelView) {
        // Check if input is of correct category and not already in list (TBD)
        if (this.modelviews == null)
            this.modelviews = new Array();
        if (!this.findModelView(modelview.id))
            this.modelviews.push(modelview);
    }
    addObject(obj: cxObject) {
        if (obj.category === constants.gojs.C_OBJECT) {
            if (this.objects == null)
                this.objects = new Array();
            if (!this.findObject(obj.id))
                this.objects.push(obj);
            else {
                const objects = this.objects;
                for (let i = 0; i < objects.length; i++) {
                    const object = objects[i];
                    if (object.id === obj.id) {
                        objects[i] = obj;
                        break;
                    }
                }
            }
        }
    }
    addRelationship(rel: cxRelationship) {
        if (rel.category === constants.gojs.C_RELATIONSHIP) {
            if (this.relships == null)
                this.relships = new Array();
            if (!this.findRelationship(rel.id))
                this.relships.push(rel);
            else {
                const relships = this.relships;
                for (let i = 0; i < relships.length; i++) {
                    const relship = relships[i];
                    if (relship.id === rel.id) {
                        relships[i] = rel;
                        break;
                    }
                }
            }
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
    findSubmodel(id: string): cxModel | null {
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
    findModelView(id: string): cxModelView | null {
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
    findModelViewByName(name: string): cxModelView | null {
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
    findObject(id: string): cxObject | null {
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
        return null;
    }
    findObjectByName(objname: string): cxObject | null {
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
    findObjectByTypeAndName(objtype: cxObjectType, objname: string): cxObject | null {
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
    findRelationship(id: string): cxRelationship | null {
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
    findRelationship1(fromObj: cxObject, toObj: cxObject, reltype: cxRelationshipType): cxRelationship | null {
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
    findRelationship2(fromObj: cxObject, toObj: cxObject, relname: string, reltype: cxRelationshipType): cxRelationship | null {
        const relships = this.relships;
        if (relships) {
            const len = utils.objExists(relships) ? relships.length : 0;
            for (let i = 0; i < len; i++) {
                const rel = relships[i];
                if (rel && rel.name === relname) {
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
    findEkaRelationship(fromObj: cxObject, toObj: cxObject, reltype: cxRelationshipType): cxObject | null {
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
    findRelationships(fromObj: cxObject, toObj: cxObject, reltype: cxRelationshipType): cxRelationship[] | null {
        const relationships = new Array();
        const relships = this.relships;
        if (relships) {
            const len = relships?.length;
            for (let i = 0; i < len; i++) {
                const rel = relships[i];
                const rtype = rel.type;
                if (rtype && rtype.id === reltype.id) {
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
    findRelationships1(fromObj: cxObject, toObj: cxObject, relkind: string): cxRelationship[] | null {
        const relationships = new Array();
        const relships = this.relships;
        if (relships) {
            const len = relships?.length;
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
                    oview.markedAsDeleted = true;
            }
        }
    }
}

export class cxInstance extends cxMetaObject {
    type: cxObjectType | cxRelationshipType | null;
    typeRef: string;
    typeName: string;
    typeview: cxObjectTypeView | cxRelationshipTypeView | null;
    fromObject: cxInstance | null;
    toObject: cxInstance | null;
    abstract: boolean;
    relshipkind: string;
    viewkind: string;
    generatedTypeId: string;
    valueset: any[] | null;
    inputrels: cxRelationship[] | null;
    outputrels: cxRelationship[] | null;
    parentModel: cxModel | null;
    allProperties: cxProperty[] | null;
    copiedFromId: string;
    constructor(id: string, name: string, type: cxObjectType | cxRelationshipType | null, description: string) {
        super(id, name, description);
        this.id = id;
        this.type = type;
        this.typeRef = type?.id;
        this.typeName = type?.name;
        this.typeview = null;
        this.fromObject = null;
        this.toObject = null;
        this.relshipkind = "";
        this.abstract = false;
        this.viewkind = "";
        this.generatedTypeId = "";
        this.valueset = null;
        this.inputrels = null;
        this.outputrels = null;
        this.parentModel = null;
        this.allProperties = null;
        this.copiedFromId = "";
        if (this.type) {
            this.relshipkind = this.getRelshipKind();
        }
    }
    // Methods
    setAndGetAllProperties(metis: cxMetis): cxProperty[] | null {
        const typeprops = this.type?.getProperties(true);
        let mtdprops = null;
        if (debug) console.log('5717 this', this);
        if (this.type.name === 'Method') {
            const mtdtype = this["methodtype"];
            if (mtdtype) {
                const metamodel = metis.currentMetamodel;
              const mtype = metamodel.findMethodTypeByName(mtdtype); 
              if (mtype) {
                mtdprops = mtype.properties;
                if (debug) console.log('5725 this', mtdprops);
              }
            }
        }
        let properties = typeprops.concat(mtdprops);  
        properties = properties.filter(function (p) {
            return p != null;
        });
        this.allProperties = properties;      
        if (debug) console.log('5739 properties', properties);
        return properties;
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
    removeInputrel(relship: cxRelationship) {
        if (!this.inputrels)
            return;
        const rels = new Array();
        const len = this.inputrels.length;
        for (let i=0; i<len; i++) {
            const rel = this.inputrels[i];
            if (rel.id !== relship.id) {
                rels.push(rel);
            }
        }
        this.inputrels = rels;
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
    removeOutputrel(relship: cxRelationship) {
        if (!this.outputrels)
            return;
        const rels = new Array();
        const len = this.outputrels.length;
        for (let i=0; i<len; i++) {
            const rel = this.outputrels[i];
            if (rel.id !== relship.id) {
                rels.push(rel);
            }
        }
        this.outputrels = rels;
    }
    setType(type: cxObjectType | cxRelationshipType) {
        this.type = type;
        this.typeName = type.name;
    }
    getType(): cxObjectType | cxRelationshipType | null {
        return this.type;
    }
    getInheritedTypes(): cxType[] | null {
        const typelist = [];
        const type = this.getType();
        const types = type?.findSupertypes(0);
        if (debug) console.log('6697 types', types);
        for (let i=0; i<types?.length; i++) {
            const tname = types[i]?.name;
            if (tname !== 'Element') 
                typelist.push(types[i]);
        }
        if (debug) console.log('6703 typelist', typelist);
        return typelist;
    }
    getInheritedTypeNames(): string[] {
        const namelist = [];
        const type = this.getType();
        const types = type?.findSupertypes(0);
        for (let i=0; i<types?.length; i++) {
            const tname = types[i]?.name;
            if (tname !== 'Element') 
                namelist.push(tname);
        }
        return namelist;
    }
    setFromObject(obj: cxObject) {
        this.fromObject = obj;
    }
    getFromObject(): cxObject | null {
        return this.fromObject as cxObject;
    }
    setToObject(obj: cxObject) {
        this.toObject = obj;
    }
    getToObject(): cxObject | null {
        return this.toObject as cxObject;
    }
    setRelshipKind(kind: string) {
        this.relshipkind = kind;
    }
    getRelshipKind(): string {
        let retval = this.relshipkind;
        if (!retval) retval = "";
        if (retval.length == 0) {
            const reltype = this.type as cxRelationshipType;
            retval = reltype.getRelshipKind();
            this.relshipkind = retval;
        }
        return retval;
    }
    setAbstract(val: boolean) {
        this.abstract = val;
    }
    getAbstract(): boolean {
        return this.abstract;
    }
    setViewKind(kind: string) {
        this.viewkind = kind;
    }
    getViewKind(): string {
        return this.viewkind;
    }
    getValueset(): any[] | null {
        return this.valueset;
    }
    getPropertyValues(): cxPropertyValue[] | null {
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
        // Check if input is of correct category and not already in list (TBD)
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
    isEkaRelationship(): boolean {
        let retval = false;
        if (this.viewkind === constants.VIEWKINDS.REL)
            retval = true;
        return retval;
    }
    setValue(propname: string, cxVal: cxValue) {  
        // Check if input is of correct category and not already in list (TBD)
        if (cxVal.category === constants.gojs.C_PROPVALUE) {
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
    getPropertyValue(prop: cxProperty, metis: cxMetis): any {
        let value;
        const inst: any = this;
        const mtdRef = prop.methodRef;
        const method = metis.findMethod(mtdRef);
        const propname = prop.name;
        if (debug) console.log('6268 prop, method', prop, method);
        if (method) {
            const mtdtype = method.methodtype;
            let context;
            switch (mtdtype) {
                case constants.types.MTD_AGGREGATEVALUE: {
                    if (debug) console.log('6273 method', method);
                    const reltype = metis.findRelationshipTypeByName(method["reltype"]);
                    const otypename = method["objtype"];
                    let objtype = null;
                    if (otypename !== 'any' && otypename !== 'null')
                        objtype = metis.findObjectTypeByName(otypename);
                    context = {
                        "myMetis":      metis,
                        "reltype":      reltype,
                        "reldir":       method["reldir"],
                        "objtype":      objtype,
                        "prop":         prop,
                    }
                    value = ui_mtd.aggregateValue(inst, context);
                }
                break;
                case constants.types.MTD_GETCONNECTEDOBJECT: {
                    if (debug) console.log('6861 method', method);
                    const rtypename = method["reltype"];
                    const reldir = method["reldir"];
                    let reltype = null;
                    if (rtypename !== 'any' && rtypename !== 'null')
                        reltype = metis.findRelationshipTypeByName(rtypename);
                    if (debug) console.log('6866 rtypename, reltype', rtypename, reltype);
                    const otypename = method["objtype"];
                    let objtype = null;
                    if (otypename !== 'any' && otypename !== 'null')
                        objtype = metis.findObjectTypeByName(otypename);
                    if (debug) console.log('6871 otypename, objtype', otypename, objtype);
                    context = {
                        "myMetis":      metis,
                        "reltype":      reltype,
                        "reldir":       reldir,
                        "objtype":      objtype,
                        "prop":         prop,
                    }
                    if (debug) console.log('6879 inst, context', inst, context);
                    const obj = ui_mtd.getConnectedObject(inst, context);
                    if (debug) console.log('6881 inst, context, obj', inst, context, obj);
                    value = obj?.name; 
                }
                break;
                case constants.types.MTD_CALCULATEVALUE:
                default: {
                    if (debug) console.log('6290 method', method);
                    context = {
                        "myMetis":   metis,
                        "prop":      prop,
                    }
                    value = ui_mtd.calculateValue(inst, context);
                    inst[propname] = value;
                }
                break;
            }            
        } else {
            value = inst[propname];
        }
        return value;
    }
    getStringValue2(propname: string): string {
        const inst: any = this;
        if (debug) console.log('4767 inst', propname, this);
        const value = this[propname];
        if (debug) console.log('4769 inst', propname, value, this);
        return value;
    }
    findInputRelships(model: cxModel, rkind: string): cxRelationship[] | null {
        const rels = model.relships;
        if (!rels) return null;
        const relships = new Array();
        for (let i = 0; i < rels.length; i++) {
            const rel = rels[i];
            if (rel) {
                if (rel.markedAsDeleted)
                    continue;
                const reltype = rel.type;
                if (reltype) {
                    const relkind = reltype.relshipkind;
                    if ((relkind.length > 0) && (relkind !== rkind))
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
    findOutputRelships(model: cxModel, rkind: string): cxRelationship[] | null {
        const rels = model.relships;
        if (!rels) return null;
        const relships = new Array();
        for (let i = 0; i < rels.length; i++) {
            const rel = rels[i];
            if (rel) {
                if (rel.markedAsDeleted)
                    continue;
                const reltype = rel.type;
                if (reltype) {
                    const relkind = reltype.relshipkind;
                    if ((relkind.length > 0) && (relkind !== rkind))
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
    addJsonValue(item_key: string, item_value: string) {
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
    constructor(id: string, name: string, type: cxObjectType | null, description: string) {
        super(id, name, type, description);
        this.fs_collection = constants.fs.FS_C_OBJECTS;    // Firestore collection
        this.category = constants.gojs.C_OBJECT;
        this.objectviews = null;

        // Handle properties
        const props = this.type?.properties;
        for (let i=0; i<props?.length; i++) {
          const prop = props[i];
          if (prop.name === 'id') continue;
          if (prop) this[prop.name] = "";
        } 
        if (debug) console.log('4600 obj', this);   
    }
    // Methods
    addObjectView(objview: cxObjectView) {
        if (!this.objectviews)
            this.objectviews = new Array();
        const len = this.objectviews.length;
        if (debug) console.log('4881 objview', objview.markedAsDeleted, objview, this.objectviews);
        for (let i=0; i<len; i++) {
            const oview = this.objectviews[i];
            if (debug) console.log('4884 objview', oview.markedAsDeleted, oview);
            if (oview.id === objview.id) {
                // Object view is already in list, copy values
                for (let prop in objview) {
                    oview[prop] = objview[prop];
                }
                if (debug) console.log('4890 objview', oview.markedAsDeleted, oview);
                return;
            }
        }
        this.objectviews.push(objview);
    }
    removeObjectView(objview: cxObjectView) {
        if (debug) console.log('4893 this.objectviews', this.objectviews);
        if (!this.objectviews) {
            // Nothing to remove
            return;
        }
        const objviews = new Array();
        const len = this.objectviews.length;
        for (let i=0; i<len; i++) {
            const oview = this.objectviews[i];
            if (oview.id !== objview.id) {
                objviews.push(oview);
            }
        }
        if (debug) console.log('4904 objview, objviews', objview, objviews);
        this.objectviews = objviews;
    }
    getObjectType(): cxObjectType | null {
        return this.type;
    }
    getInheritanceObjects(model: cxModel): cxObject[] | null {
        const objlist = [];
        const relships = this.findOutputRelships(model, constants.relkinds.GEN);
        if (relships?.length) {
            for (let i=0; i<relships?.length; i++) {
                const rel = relships[i];
                if (rel) {
                    const toObj = rel.toObject;
                    if (toObj)
                    objlist.push(toObj);
                }
            }
        }
        if (debug) console.log('6459 objlist', objlist);
        return objlist;
    }
    getInheritedObjectTypes(model: cxModel): cxType[] | null {
        const typelist = [];
        // Handle Is relationships from the object
        const relships = this.findOutputRelships(model, constants.relkinds.GEN);
        for (let i=0; i<relships?.length; i++) {
            const rel = relships[i];
            if (rel) {
                const toObj = rel.toObject;
                if (toObj && toObj.type) {
                    // if (toObj.type.properties.length > 0)
                        typelist.push(toObj.type);
                }
            }
        }
        // Then handle the type itself
        const type = this.type;
        const supertypes = type?.getSupertypes();
        for (let i=0; i<supertypes?.length; i++) {
            const stype = supertypes[i];
            typelist.push(stype);
        }
        if (debug) console.log('6472 typelist', typelist);
        return typelist;
    }
    getConnectedObject(prop: cxProperty, metis: cxMetis): cxObject {
        let obj = null;
        const inst: any = this;
        const mtdRef = prop.methodRef;
        const method = metis.findMethod(mtdRef);
        const propname = prop.name;
        if (debug) console.log('7083 prop, method', prop, method);
        if (method) {
            const mtdtype = method.methodtype;
            if ( mtdtype === constants.types.MTD_GETCONNECTEDOBJECT) {
                let context;
                if (debug) console.log('7087 method', method);
                const rtypename = method["reltype"];
                const reldir = method["reldir"];
                let reltype = null;
                if (rtypename !== 'any' && rtypename !== 'null')
                    reltype = metis.findRelationshipTypeByName(rtypename);
                if (debug) console.log('7093 rtypename, reltype', rtypename, reltype);
                const otypename = method["objtype"];
                let objtype = null;
                if (otypename !== 'any' && otypename !== 'null')
                    objtype = metis.findObjectTypeByName(otypename);
                if (debug) console.log('7098 otypename, objtype', otypename, objtype);
                context = {
                    "myMetis":      metis,
                    "reltype":      reltype,
                    "reldir":       reldir,
                    "objtype":      objtype,
                    "prop":         prop,
                }
                obj = ui_mtd.getConnectedObject(this, context);
                if (debug) console.log('7107 inst, context, obj', inst, context, obj);
            }
        }
        return obj;
        }
    getConnectedObjects(metis: cxMetis) {
        const type = this.type;
        const properties = type?.properties;
        const objlist = [];
        for (let i=0; i<properties?.length; i++) {
            const prop = properties[i];
            if (prop) {
                const obj = this.getConnectedObject(prop, metis);
                if (obj)
                    objlist.push(obj);
             }
        } 
        return objlist;           
    }
    getConnectedObjectRoles(metis: cxMetis) {
        const type = this.type;
        const properties = type?.properties;
        const rolelist = [];
        for (let i=0; i<properties?.length; i++) {
            const prop = properties[i];
            if (prop) {
                const obj = this.getConnectedObject(prop, metis);
                if (obj)
                    rolelist.push(prop.name);
             }
        } 
        return rolelist;           
    }
    hasInheritedProperties(model: cxModel): boolean {
        let retval = false;
        let types = this.getInheritedTypes();
        if (types?.length > 0) {
            for (let i=0; i<types.length; i++) {
                const type = types[i];
                if (type.hasProperties())
                    return true;
            }
        }
        types = this.getInheritedObjectTypes(model);
        if (types?.length > 0) {
            for (let i=0; i<types?.length; i++) {
            const type = types[i];
            if (type.hasProperties())
                return true;
            }
        }
        let objects = this.getInheritanceObjects(model);
        if (debug) console.log('6496 this, objects', this, objects);
        if (types?.length > 0) {
            for (let i=0; i<objects?.length; i++) {
                const obj = objects[i];
                const type = obj?.type;
                if (type?.hasProperties())
                    return true;
            }
        }
        return retval;
    }  
    getInheritedProperties(model: cxModel): cxProperty[] {
        const properties = new Array();
        let objects = this.getInheritanceObjects(model);
        if (debug) console.log('7159 inheritanceObjects', objects);
        for (let i=0; i<objects?.length; i++) {
            const obj = objects[i];
            const type = obj?.type;
            if (type?.hasProperties()) {
                const props = type.properties;
                for (let j=0; j<props.length; j++) {
                    const prop = props[j];
                    properties.push(prop);
                }
            }
        }  
        if (debug) console.log('7171 inherited Porperties', properties);
        return properties;  
    }
    isOfType(typeName: string): boolean {
        let retval = false;
        if (this.type.name === typeName) { 
            return true;
        }
        const stypes = this.type.supertypes;
        for (let i=0; i<stypes?.length; i++) {
            const stype = stypes[i];
            if (stype?.name === typeName)
                return true;
        }
        return retval;
    }
    isOfSystemType(systemtypeName: string): boolean {
        let retval = false;
        const type = this.type;
        if ((this.name === type.name) || (type.name === systemtypeName)) { 
            return true;
        }
        const stypes = type.supertypes;
        for (let i=0; i<stypes?.length; i++) {
            const stype = stypes[i];
            if (stype?.name === systemtypeName)
                return true;
        }
        return retval;
    }
}

export class cxRelationship extends cxInstance {
    relshipviews: cxRelationshipView[] | null;
    cardinality: string;
    cardinalityFrom: string;
    cardinalityTo: string;
    nameFrom: string;
    nameTo: string;
    constructor(id: string, type: cxRelationshipType | null, fromObj: cxObject | null, toObj: cxObject | null, name: string, description: string) {
        super(id, name, type, description);
        this.fs_collection = constants.fs.FS_C_RELATIONSHIPS;  // Firestore collection
        this.category = constants.gojs.C_RELATIONSHIP;
        this.fromObject = fromObj as cxObject;
        this.toObject = toObj as cxObject;
        this.cardinality = "";
        this.cardinalityFrom = "";
        this.cardinalityTo = "";
        this.nameFrom = "";
        this.nameTo = "";
        if (!this.typeName) this.typeName = name;
        if (this.type) {
            this.cardinality = this.getCardinality();
            this.cardinalityFrom = this.getCardinalityFrom();
            this.cardinalityTo = this.getCardinalityTo();
        }
        toObj?.addInputrel(this);
        fromObj?.addOutputrel(this);
    }
    // Methods
    setNameFrom(name: string) {
        this.nameFrom = name;
    }
    getNameFrom(): string {
        return this.nameFrom;
    }
    setNameTo(name: string) {
        this.nameTo = name;
    }
    getNameTo(): string {
        return this.nameTo;
    }
    addRelationshipView(relview: cxRelationshipView) {
        if (!this.relshipviews)
            this.relshipviews = new Array();
        const len = this.relshipviews.length;
        for (let i=0; i<len; i++) {
            const rview = this.relshipviews[i];
            if (rview.id === relview.id) {
                // Relationshipview is already in list
                return;
            } else {
                if ((!rview.fromObjview) || (!rview.toObjview))
                    return;
            }
        }
        this.relshipviews.push(relview);
    }
    removeRelationshipView(relview: cxRelationshipView) {
        if (!this.relshipviews) {
            // Nothing to remove
            return;
        }
        const relviews = new Array();
        const len = this.relshipviews.length;
        for (let i=0; i<len; i++) {
            const rview = this.relshipviews[i];
            if (rview.id !== relview.id) {
                relviews.push(rview);
            }
        }
        this.relshipviews = relviews;
    }
    getRelationshipViews(): cxRelationshipView[] | null {
        return this.relshipviews;
    }
    getRelationshipType(): cxRelationshipType | null {
        return this.type as cxRelationshipType;
    }
    getCardinality(): string {
        let retval = this.cardinality;
        if (!retval) retval = "";
        if (retval.length == 0) {
            const reltype = this.type as cxRelationshipType;
            retval = reltype.getCardinality();
            this.cardinality = retval;
        }
        return retval;
    }
    getCardinalityFrom(): string {
        let retval = this.cardinalityFrom;
        if (!retval) retval = "";
        if (retval.length == 0) {
            const reltype = this.type as cxRelationshipType;
            if (reltype) {
                retval = reltype.getCardinalityFrom();
                this.cardinalityFrom = retval;
            }
        }
        return retval;
    }
    getCardinalityTo(): string {
        let retval = this.cardinalityTo;
        if (!retval) retval = "";
        if (retval.length == 0) {
            const reltype = this.type as cxRelationshipType;
            if (reltype) {
                retval = reltype.getCardinalityTo();
                this.cardinalityTo = retval;
            }
        }
        return retval;
    }
    isSystemRel(): boolean {
        let retval = false;
        const reltype = this.type as cxRelationshipType;
        if (reltype && reltype.toObjtype) {
            if (reltype.toObjtype.name === constants.types.AKM_PROPERTY) {
                if (reltype.name === constants.types.AKM_HAS_PROPERTY) {
                    retval = true;
                }
            } else if (reltype.toObjtype.name === constants.types.AKM_METHOD) {
                if (reltype.name === constants.types.AKM_HAS_METHOD) {
                    retval = true;                    
                }
            } else if (reltype.toObjtype.name === constants.types.AKM_INPUTPATTERN) {
                if (reltype.name === constants.types.AKM_HAS_INPUTPATTERN) {
                    retval = true;                    
                }
            } else if (reltype.toObjtype.name === constants.types.AKM_VIEWFORMAT) {
                if (reltype.name === constants.types.AKM_HAS_VIEWFORMAT) {
                    retval = true;                    
                }
            } else if (reltype.toObjtype.name === constants.types.AKM_FIELDTYPE) {
                if (reltype.name === constants.types.AKM_HAS_FIELDTYPE) {
                    retval = true;                    
                }
            } else if (reltype.toObjtype.name === constants.types.AKM_COLLECTION) {
                if (reltype.name === constants.types.AKM_HAS_COLLECTION) {
                    retval = true;                    
                }
            } else if (reltype.fromObjtype.name === constants.types.AKM_LABEL) {
                if (reltype.name === constants.types.AKM_ANNOTATES) {
                    retval = true;                    
                }
            }
        }
        return retval;
    }
}

export class cxPropertyValue {
    property: cxProperty;
    value: string;
    constructor(prop: cxProperty, value: string) {
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
    viewFormat: string;
    constructor(id: string, name: string, description: string ) {
        super(id, name, description);
        this.viewFormat = "%s";
    }
    // Methods
    getViewFormat(): string {
        return this.viewFormat;
    }
    setViewFormat(fmt: string) {
        // Todo: Check if valid format
        this.viewFormat = fmt;
    }
}

export class cxFieldType extends cxMetaObject {
    fieldType: string;
    constructor(id: string, name: string, description: string ) {
        super(id, name, description);
        this.fieldType = "text";
    }
    // Methods
    getFieldType(): string {
        return this.fieldType;
    }
    setFieldType(type: string) {
        this.fieldType = type;
    }
}

export class cxInputPattern extends cxMetaObject {
    inputPattern: string;
    constructor(id: string, name: string, description: string ) {
        super(id, name, description);
        this.inputPattern = "";
    }
    // Methods
    getInputPattern(): string {
        return this.inputPattern;
    }
    setInputPattern(pattern: string) {
        // Todo: Check if valid format
        this.inputPattern = pattern;
    }
}

// ---------------------------------------------------------------------
export class cxModelView extends cxMetaObject {
    model: cxModel | null;
    viewstyle: cxViewStyle | null;
    viewstyles: cxViewStyle[] | null;
    objecttypeviews: cxObjectTypeView[] | null;
    relshiptypeviews: cxRelationshipTypeView[] | null;
    objectviews: cxObjectView[] | null;
    relshipviews: cxRelationshipView[] | null;
    scale: string;
    memberscale: string;
    layout: string;
    routing: string;
    linkcurve: string;
    showCardinality: boolean;
    askForRelshipName: boolean;
    includeInheritedReltypes: boolean | null;
    template: any;
    isTemplate: boolean;
    diagrams: cxDiagram[] | null;
    constructor(id: string, name: string, model: cxModel | null, description: string) {
        super(id, name, description);
        this.category = constants.gojs.C_MODELVIEW;
        this.fs_collection = constants.fs.FS_C_MODELVIEWS;  // Firestore collection
        this.model = model;
        this.viewstyle = null; // Default viewstyle
        this.viewstyles = null;
        this.objecttypeviews = null;
        this.relshiptypeviews = null;
        this.objectviews = null;
        this.relshipviews = null;
        this.scale = "1";
        this.memberscale = constants.params.MEMBERSCALE;
        this.layout = "Tree";
        this.routing = "Normal";
        this.linkcurve = "None";
        this.showCardinality = false;
        this.askForRelshipName = false;
        this.includeInheritedReltypes = null; // model?.metamodel?.includeInheritedReltypes;
        this.template = null;
        this.isTemplate = false;
        this.diagrams = null;
    }
    // Methods
    clearContent() {
        this.viewstyle = null; // Default viewstyle
        this.viewstyles = null;
        this.objecttypeviews = null;
        this.relshiptypeviews = null;
        this.objectviews = null;
        this.relshipviews = null;
        this.layout = "Tree";
        this.routing = "Normal";
        this.linkcurve = "None";
        this.showCardinality = false;
        this.template = null;
        this.isTemplate = false;
        this.diagrams = null;
    }
    setModel(model: cxModel) {
        this.model = model;
    }
    getModel(): cxModel {
        return this.model;
    }
    setViewStyle(vstyle: cxViewStyle) {
        this.viewstyle = vstyle;
    }
    getViewStyle(): cxViewStyle {
        return this.viewstyle;
    }
    setViewStyles(vstyles: cxViewStyle[]) {
        this.viewstyles = vstyles;
    }
    getViewStyles(): cxViewStyle[] {
        return this.viewstyles;
    }
    setLayout(layout: string) {
        this.layout = layout;
    }
    getLayout(): string {
        return this.layout;
    }
    setRouting(routing: string) {
        this.routing = routing;
    }
    getRouting(): string {
        return this.routing;
    }
    setTemplate(template: any) {
        this.template = template;
    }
    getTemplate(): any {
        return this.template;
    }
    setIsTemplate(flag: boolean) {
        this.isTemplate = flag;
    }
    getIsTemplate(): boolean {
        return this.isTemplate;
    }
    setObjectViews(objviews: cxObjectView[]) {
        this.objectviews = objviews;
    }
    getObjectViews(): cxObjectView[] | null{
        return this.objectviews;
    }
    setObjectTypeViews(objecttypeviews: cxObjectTypeView[]) {
        this.objecttypeviews = objecttypeviews;
    }
    getObjecTypeViews(): cxObjectTypeView[] | null {
        return this.objecttypeviews;
    }
    setRelationshipViews(relviews: cxRelationshipView[]) {
        this.relshipviews = relviews;
    }
    getRelationshipViews(): cxRelationshipView[] | null {
        return this.relshipviews;
    }
    setRelationshipTypeViews(relshiptypeviews: cxRelationshipTypeView[]) {
        this.relshiptypeviews = relshiptypeviews;
    }
    getRelationshipTypeViews(): cxRelationshipTypeView[] | null {
        return this.relshiptypeviews;
    }
    addObjectTypeView(objtypeView: cxObjectTypeView) {
        // Check if input is of correct category and not already in list (TBD)
        if (objtypeView.category === constants.gojs.C_OBJECTTYPEVIEW) {
            if (this.objecttypeviews == null)
                this.objecttypeviews = new Array();
            this.objecttypeviews.push(objtypeView);
        }
    }
    addRelationshipTypeView(reltypeView: cxRelationshipTypeView) {
        // Check if input is of correct category and not already in list (TBD)
        if (reltypeView.category === constants.gojs.C_RELSHIPTYPEVIEW) {
            if (this.relshiptypeviews == null)
                this.relshiptypeviews = new Array();
            this.relshiptypeviews.push(reltypeView);
            if (debug) console.log('7461 reltypeView', reltypeView);
        }
    }
    addObjectView(objview: cxObjectView) {
        // Check if input is of correct category and not already in list (TBD)
        if (debug) console.log('5151 objview', objview.markedAsDeleted, objview);
        if (objview.category === constants.gojs.C_OBJECTVIEW) {
            if (this.objectviews == null)
                this.objectviews = new Array();
            const oview = this.findObjectView(objview.id);
            if (!oview)
                this.objectviews.push(objview);
            else {
                for (let prop in objview) {
                    objview[prop] = objview[prop];
                }
            }
        }
    }
    removeObjectView(objview: cxObjectView) {
        if (!this.objectviews) {
            // Nothing to remove
            return;
        }
        const objviews = new Array();
        const len = this.objectviews.length;
        for (let i=0; i<len; i++) {
            const oview = this.objectviews[i];
            if (oview.id !== objview.id) {
                objviews.push(oview);
            }
        }
        if (debug) console.log('5171 objview, objviews', objview, objviews);
        this.objectviews = objviews;
    }
    addRelationshipView(relshipview: cxRelationshipView) {
        // Check if input is of correct category and not already in list (TBD)
        if (relshipview.category === constants.gojs.C_RELSHIPVIEW) {
            if (this.relshipviews == null)
                this.relshipviews = new Array();
            if (!this.findRelationshipView(relshipview.id)) {
                if ((!relshipview.fromObjview) || (!relshipview.toObjview))
                    return;
                this.relshipviews.push(relshipview);
            }
        }
    }
    findObjectView(id: string): cxObjectView | null {
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
    findObjectViewByName(name: string): cxObjectView | null {
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
    findObjectViewsByObj(obj: cxObject): cxObjectView[] | null {
        const objviews = new Array();
        let oviews = this.objectviews;
        if (!oviews) 
            return null;
        for (let i=0; i<oviews.length; i++) {
            const ov = oviews[i];
            if (ov?.object?.id === obj.id) {
                objviews.push(ov);
            }
        }
        return objviews;
    }
    findObjectTypeView(id: string): cxObjectTypeView | null {
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
    findRelationshipView(id: string): cxRelationshipView | null {
        let relshipviews = this.relshipviews;
        if (!relshipviews) return null;
        let i = 0;
        let rv = null;
        while (i < relshipviews.length) {
            rv = relshipviews[i];
            if (rv) {
                if (rv.id === id)
                    return rv;
                else if (rv.getFirestoreId() === id)
                    return rv;
            }
            i++;
        }
    }
    findRelationshipViewsByRel(rel: cxRelationship): cxRelationshipView[] | null {
        const relviews = new Array();
        let rviews = this.relshipviews;
        if (!rviews) 
            return null;
        for (let i=0; i<rviews.length; i++) {
            const rv = rviews[i];
            if (rv?.markedAsDeleted)
                continue;
            if (rv?.relship?.id === rel.id) {
                relviews.push(rv);
            }
        }
        return relviews;
    }
    findRelationshipViewsByRel2(rel: cxRelationship, fromObjview: cxObjectView, toObjview: cxObjectView): cxRelationshipView[] {
        const relviews = new Array();
        if (fromObjview && toObjview) {
            let rviews = this.relshipviews;
            if (!rviews) 
                return null;
            for (let i=0; i<rviews.length; i++) {
                const rv:cxRelationshipView = rviews[i];
                if (rv?.markedAsDeleted)
                    continue;
                if (rv?.relship?.id === rel?.id) {
                    if (rv.fromObjview?.id === fromObjview.id) {
                        if (rv.toObjview?.id === toObjview.id)
                            relviews.push(rv);
                    }
                }
            }
        }
        return relviews;
    }
    findRelationshipTypeView(id: string): cxRelationshipTypeView | null {
        if (!this.relshiptypeviews) return null;
        let i = 0;
        let obj = null;
        while (i < this.relshiptypeviews?.length) {
            obj = this.relshiptypeviews[i];
            if (obj?.markedAsDeleted)
                continue;
            if (obj) {
                if (obj.id === id)
                    return obj;
                else if (obj.getFirestoreId() === id)
                    return obj;
            }
            i++;
        }
        return null;
    }
}

export class cxObjectView extends cxMetaObject {
    category: string;
    fs_collection: string;
    object: cxObject | null;
    objectRef: string;
    typeview: cxObjectTypeView | null;
    typeviewRef: string;
    group: string;
    isGroup: boolean;
    groupLayout: string;
    parent: string;
    isCollapsed: boolean;
    visible: boolean;
    text: string;
    loc: string;
    size: string;
    scale1: string;
    memberscale: string;
    arrowscale: string;
    textscale: string;
    viewkind: string;
    template: string;
    figure: string;
    geometry: string;
    fillcolor: string;
    fillcolor2: string;
    strokecolor: string;
    strokecolor2: string;
    strokewidth: string;
    textcolor: string;
    icon: string;
    constructor(id: string, name: string, object: cxObject | null, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_OBJECTVIEWS;  // Firestore collection
        this.category = constants.gojs.C_OBJECTVIEW;
        this.object = object;
        this.objectRef = "";
        this.typeview = object?.type?.typeview as cxObjectTypeView;              
        this.typeviewRef = this.typeview?.id;
        this.group = "";
        this.isGroup = false;
        this.groupLayout = "";
        this.parent = "";
        this.isCollapsed = false;
        this.text = "";
        this.visible = true;
        this.viewkind = "";
        this.loc = "";
        this.size = "";
        this.scale1 = "1";
        this.memberscale = this.typeview?.memberscale ? this.typeview.memberscale : "1";
        this.arrowscale = this.typeview?.arrowscale ? this.typeview.arrowscale : "1.3";
        this.textscale = this.typeview?.textscale ? this.typeview.textscale : "1";
        this.template = "";
        this.figure = "";
        this.geometry = "";
        this.fillcolor = "";
        this.fillcolor2 = "";
        this.strokecolor = "";
        this.strokecolor2 = "";
        this.strokewidth = "1";
        this.textcolor = "";
        this.icon = "";
    }
    // Methods
    setObject(object: cxObject) {
        if (utils.objExists(object)) {
            this.object = object;
        }
    }
    getObject(): cxObject | null {
        return this.object;
    }
    getObjectType(): cxObjectType | null {
        const obj = this.getObject();
        if (obj) {
            return obj.getType();
        }
    }
    setTypeView(typeview: cxObjectTypeView) {
        if (typeview) {
            this.typeview = typeview;
        }
    }
    getTypeView(): cxObjectTypeView | null {
        return this.typeview;
    }
    getDefaultTypeView(): cxObjectTypeView | null {
        const obj = this.getObject();
        if (obj) {
            const objtype = obj.getType() as cxObjectType;
            if (objtype) {
                const typeview = objtype.typeview as cxObjectTypeView;
                return typeview;
            }
        }
        return null;
    }
    setIcon(icon: string) {
        this.icon = icon;
    }
    getIcon(): string {
        if (this.icon)
            return this.icon;
        return "";
    }
    setIsGroup(flag: boolean) {
        this.isGroup = flag;
    }
    getIsGroup(): boolean {
        if (utils.objExists(this.isGroup))
            return this.isGroup;
        return false;
    }
    setGroup(group: string) {
        this.group = group;
    }
    getGroup(): string {
        if (utils.objExists(this.group))
            return this.group;
        return "";
    }
    setGroupLayout(groupLayout: string) {
        this.groupLayout = groupLayout;
    }
    getGroupLayout(): string {
        if (utils.objExists(this.groupLayout))
            return this.groupLayout;
        return "";
    }
    getParentModelView(model: cxModel): cxModelView | null {
        const mviews = model.modelviews;
        for (let i=0; i<mviews.length; i++) {
            const mview = mviews[i];
            if (mview) {
                const objviews = mview.objectviews;
                for (let j=0; j<objviews.length; j++) {
                    const oview = objviews[j];
                    if (this.id === oview.id)
                        return mview;
                }
            }
        }
        return null;
    }
    // To be done ??
    getGroupMembers(modelView: cxModelView): cxObjectView[] | null {
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
    getParent(): string {
        if (utils.objExists(this.parent))
            return this.parent;
        return "";
    }
    setTemplate(template: string) {
        if (template == undefined)
        template = "";
        this.template = template;
    }
    getTemplate(): string {
        if (this.template == undefined)
            return "";
        return this.template;
    }
    setFigure(figure: string) {
        if (figure == undefined)
        figure = "";
        this.figure = figure;
    }
    getFigure(): string {
        if (this.template == undefined)
            return "";
        return this.template;
    }
    setSize(size: string) {
        if (size == undefined)
            size = "";
        this.size = size;
    }
    getSize(): string {
        if (this.size == undefined)
            return "";
        return this.size;
    }
    setScale(scale: string) {
        if (scale == undefined)
        scale = "1";
        this.scale1 = scale;
    }
    getScale(): string {
        if (this.scale1 == undefined)
            return "1";
        return this.scale1;
    }
    setMemberscale(memberscale: string) {
        if (memberscale == undefined)
            this.memberscale = this.typeview?.memberscale ? this.typeview.memberscale : "1";
        this.memberscale = memberscale;
    }
    getMemberscale(): string {
        if (this.memberscale == undefined)
            return this.typeview?.memberscale ? this.typeview.memberscale : "1";
        return this.memberscale;
    }
    setArrowscale(arrowscale: string) {
        if (arrowscale == undefined)
            this.arrowscale = this.typeview?.arrowscale ? this.typeview.arrowscale : "1.3";
        this.arrowscale = arrowscale;
    }
    getArrowscale(): string {
        if (this.arrowscale == undefined)
            return this.typeview?.arrowscale ? this.typeview.arrowscale : "1.3";
        return this.arrowscale;
    }
    setTextscale(scale: string) {
        if (scale == undefined)
        scale = "1";
        this.textscale = scale;
    }
    getTextscale(): string {
        if (this.textscale == undefined)
            return "1";
        return this.textscale;
    }
    setLoc(loc: string) {
        this.loc = loc;
    }
    getLoc(): string {
        if (utils.objExists(this.loc))
            return this.loc;
        return "";
    }
    clearViewdata() {
        const viewdata = this.typeview.data;
        for (let k in viewdata) {
            if (k === 'class') continue;
            if (k === 'abstract') continue;
            if (k === 'isGroup') continue;
            if (k === 'group') continue;
            if (k === 'viewkind') continue;
            this[k] = "";
        }
    }
}

export class cxRelationshipView extends cxMetaObject {
    category:       string;
    fs_collection:  string;
    relship:        cxRelationship | null;
    typeview:       cxRelationshipTypeView | null;
    fromObjview:    cxObjectView | null;
    toObjview:      cxObjectView | null;
    template:       string;
    textscale:      string;
    arrowscale:     string;
    strokecolor:    string;
    strokewidth:    string;
    textcolor:      string;
    dash:           string;
    fromArrow:      string;
    toArrow:        string;
    fromArrowColor: string;
    toArrowColor:   string;
    points:         any;
    constructor(id: string, name: string, relship: cxRelationship | null, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_RELSHIPVIEWS;  // Firestore collection
        this.category = constants.gojs.C_RELSHIPVIEW;
        this.relship = relship;
        this.typeview = relship?.type?.typeview as cxRelationshipTypeView;             
        this.fromObjview = null;
        this.toObjview = null;
        this.template  = "";
        this.textscale = "";
        this.arrowscale = "";
        this.strokecolor = "";
        this.strokewidth = "";
        this.textcolor = "";
        this.dash = "";
        this.fromArrow = "";
        this.toArrow = "";
        this.fromArrowColor = "";
        this.toArrowColor = "";
        this.points = null;
    }
    // Methods
    getRelationship(): cxRelationship | null {
        return this.relship;
    }
    setRelationship(rel: cxRelationship) {
        if (rel) this.relship = rel;
    }
    setTypeView(typeview: cxRelationshipTypeView) {
        if (typeview) {
            this.typeview = typeview;
        }
    }
    getTypeView(): cxRelationshipTypeView | null {
        return this.typeview;
    }
    setFromObjectView(objview: cxObjectView) {
        if (utils.objExists(objview)) {
            this.fromObjview = objview;
        }
    }
    getFromObjectView(): cxObjectView | null {
        return this.fromObjview;
    }
    setToObjectView(objview: cxObjectView) {
        if (utils.objExists(objview)) {
            this.toObjview = objview;
        }
    }
    getToObjectView(): cxObjectView | null {
        return this.toObjview;
    }
    clearViewdata() {
        const viewdata = this.typeview.data;
        for (let k in viewdata) {
            if (k === 'class') continue;
            if (k === 'abstract') continue;
            if (k === 'relshipkind') continue;
            this[k] = "";
        }
    }
    setTemplate(template: string) {
        if (template == undefined)
        template = "";
        this.template = template;
    }
    getTemplate(): string {
        if (this.template == undefined)
            return "";
        return this.template;
    }
    setTextScale(scale: string) {
        this.textscale = scale;
    }
    getTextScale(): string {
        if (this.textscale == undefined)
            return "1";
        return this.textscale;
    }
    setArrowScale(scale: string) {
        this.arrowscale = scale;
    }
    getArrowScale(): string {
        if (this.arrowscale == undefined)
            return "1";
        return this.arrowscale;
    }
    setFromArrow(fromArrow: string) {
        this.fromArrow = fromArrow;
    }
    setFromArrowColor(color: string) {
        this.fromArrowColor = color;
    }
    setFromArrow2(relshipkind: string) {
        switch (relshipkind) {
            case 'Composition':
                this.setFromArrow('StretchedDiamond');
                this.setFromArrowColor('black');
                this.textcolor = 'black';
                break;
            case 'Aggregation':
                this.setFromArrow('StretchedDiamond');
                this.setFromArrowColor('white');
                this.textcolor = 'black';
                break;
            case 'Generalization':
                this.setFromArrow(' ');
                this.setFromArrowColor(' ');
                this.textcolor = 'black';
                break;
            default:
                break;
        }
        if (debug) console.log('5773 fromArrowColor', this.fromArrowColor);
    }
    setToArrow(toArrow: string) {
        this.toArrow = toArrow;
    }
    setToArrowColor(color: string) {
        this.toArrowColor = color;
    }
    setToArrow2(relshipkind: string) {
        switch (relshipkind) {
            case 'Generalization':
                this.setToArrow('Triangle');
                this.setToArrowColor('white');
                this.textcolor = 'black';
                break;
            case 'Aggregation':
            case 'Composition':
                this.setToArrow('OpenTriangle');
                this.textcolor = 'black';
                break;
            default:
                break;
        }
    }
}

export class cxGeometry extends cxMetaObject {
    geometry: string;
    stroke:   string;
    fill:     string;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.geometry = "";
        this.stroke   = "";
        this.fill     = "";
    }
    // Methods
    setGeometry(geo: string, stroke: string, fill: string) {
        this.geometry = geo;
        this.stroke   = stroke;
        this.fill     = fill;
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
    getModelView(): cxModelView | null {
        return this.modelview;
    }
    setContent(jsonContent: any) {
        this.content = jsonContent;
    }
    getContent(): any {
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