// @ts-nocheck
const debug = false;

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
const constants = require('./constants');

import * as gjs from './ui_gojs';
import { i } from '../components/utils/SvgLetters';
// import { type } from 'os';

// cxMetis

export class cxMetis {
    id: string;
    name: string;
    description: string;
    category: string;
    projects: cxModelSuite[] | null;
    metamodels: cxMetaModel[] | null = null;
    coreMetamodel: cxMetaModel | null = null;
    viewstyles: cxViewStyle[] | null;
    geometries: cxGeometry[] | null;
    models: cxModel[] | null = null;
    submodels: cxModel[] | null = null;
    modelviews: cxModelView[] | null = null;
    datatypes: cxDatatype[] | null = null;
    inputpatterns: cxInputPattern[] | null = null;
    viewformats: cxViewFormat[] | null = null;
    fieldTypes: cxFieldType[] | null = null;
    enumerations: cxEnumeration[] | null = null;
    units: cxUnit[] | null = null;
    categories: cxUnitCategory[] | null = null;
    properties: cxProperty[] | null = null;
    methods: cxMethod[] | null = null;
    methodtypes: cxMethodType[] | null = null;
    objecttypes: cxObjectType[] | null = null;
    relshiptypes: cxRelationshipType[] | null = null;
    objecttypeviews: cxObjectTypeView[] | null = null;
    objtypegeos: cxObjtypeGeo[] | null = null;
    relshiptypeviews: cxRelationshipTypeView[] | null = null;
    objects: cxObject[] | null = null;
    relships: cxRelationship[] | null = null;
    objectviews: cxObjectView[] | null = null;
    relshipviews: cxRelationshipView[] | null = null;
    allowGenerateCurrentMetamodel: boolean = false;
    gojsModel: gjs.goModel | null = null;
    currentProject: cxProject | null = null;
    currentMetamodel: cxMetaModel | null = null;
    currentMetamodelRef: string | null = null;
    currentModel: cxModel | null = null;
    currentModelRef: string | null = null;
    currentModelview: cxModelView | null = null;
    currentModelviewRef: string | null = null;
    currentTargetMetamodel: cxMetaModel | null = null;
    currentTargetModel: cxModel | null = null;
    currentTargetModelview: cxModelView | null = null;
    currentTargetMetamodelRef: string;
    currentTargetModelRef: string;
    currentTargetModelviewRef: string;
    currentTemplateMetamodel: cxMetaModel | null = null;
    currentTemplateModel: cxModel | null = null;
    currentTemplateModelview: cxModelView | null = null;
    currentTaskModel: cxModel | null = null;
    currentTaskModelRef: string;
    currentNode: any;
    currentLink: any;
    myDiagram: any;
    pasteViewsOnly: boolean = false;
    deleteViewsOnly: boolean = false;
    pasted: boolean = false;
    relinkedRelview: cxRelationshipView | null = null;
    modelType: string = "";
    adminModel: cxModel;
    showAdminModel: boolean;
    dispatch: any;
    fromNodes: any;
    currentSelection: any;
    // Constructor
    constructor() {
        this.id = utils.createGuid();
        this.name = "";
        this.description = "";
        this.viewstyles = [];
        this.geometries = [];
        this.category = 'Metis';
        this.fromNodes = [];
        const portType = new cxObjectType(utils.createGuid(), 'Port', 'Port type');
        this.objecttypes = [portType];
    }
    importData(importedData: any, includeDeleted: boolean) {
        this.name = importedData.name;
        this.description = importedData.description
        this.initImport(importedData, includeDeleted);
        // Handle projects aka modelSuites
        const projects = (importedData) && importedData.projects;
        if (projects && projects.length) {
            for (let i = 0; i < projects.length; i++) {
                const project = projects[i];
                if (project) this.importProject(project);
            }
        }

        // Handle metamodels
        const metamodels = (importedData) && importedData.metamodels;
        const len = metamodels.length;
        if (metamodels && metamodels.length > 0) {
            for (let i = len - 1; i >= 0; i--) {
                const metamodel = metamodels[i];
                if (!metamodel) continue;
                if (metamodel.name === constants.core.AKM_CORE_MM)
                    continue;
                if (metamodel && metamodel.id) {
                    this.importMetamodel(metamodel);
                    this.addMetamodel(metamodel);
                }
            }
            for (let i = len - 1; i >= 0; i--) {
                const metamodel = metamodels[i];
                if (!metamodel) continue;
                if (metamodel.name !== constants.core.AKM_CORE_MM)
                    continue;
                if (metamodel && metamodel.id) {
                    this.importMetamodel(metamodel);
                    this.addMetamodel(metamodel);
                    this.coreMetamodel = metamodel;
                }
            }
        }
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
        // handle submodels
        let mmodels = importedData.metamodels;
        if (mmodels && mmodels.length) {
            mmodels.forEach(mmodel => {
                const subModels = mmodel.subModels;
                if (subModels && subModels.length) {
                    subModels.forEach(subModel => {
                        const submodel = this.findSubModel(subModel.id);
                        if (submodel) {
                            const metamodel = this.findMetamodel(mmodel.id);
                            if (metamodel) {
                                metamodel.addSubModel(submodel);
                            }
                        }
                    })
                } else {
                    const subModelRefs = mmodel.subModelRefs;
                    if (subModelRefs && subModelRefs.length) {
                        subModelRefs.forEach(subModelRef => {
                            const subModel = this.findModel(subModelRef);
                            if (subModel) {
                                const metamodel = this.findMetamodel(mmodel.id);
                                metamodel.addSubModel(subModel);
                            }
                        })
                    }
                }
            })
        }
        if (false) { // Handle objects 
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
        }
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
        for (let i = 0; i < objtypes?.length; i++) {
            const otype = objtypes[i];
            const stypes = otype.findSupertypes(0);
            for (let j = 0; j < stypes?.length; j++) {
                const stype = stypes[j];
                otype.addSupertype(stype);
            }
        }

        // Postprocess objecttypeviews
        const objtypeviews = this.objecttypeviews;
        for (let i = 0; i < objtypeviews?.length; i++) {
            const otypeview = objtypeviews[i];
            if (otypeview && otypeview.name === otypeview.id) {
                const otype = this.findObjectType(otypeview.typeRef);
                if (otype)
                    otypeview.name = otype.name;
            }
        }
        mmodels = this.metamodels;
        if (false) {
            // Postprocess relshiptypeviews
            for (let i = 0; i < mmodels?.length; i++) {
                const mmodel = mmodels[i];
                const rtviews = new Array();
                const reltypeviews = mmodel.relshiptypeviews;
                for (let i = 0; i < reltypeviews?.length; i++) {
                    const rtypeview = reltypeviews[i];
                    const typeRef = rtypeview.typeRef;
                    if (typeRef)
                        rtviews.push(rtypeview);
                }
                mmodel.relshiptypeviews = rtviews;
            }
            const rtviews = new Array();
            const reltypeviews = this.relshiptypeviews;
            for (let i = 0; i < reltypeviews?.length; i++) {
                const rtypeview = reltypeviews[i];
                const typeRef = rtypeview.typeRef;
                if (typeRef)
                    rtviews.push(rtypeview);
            }
            this.relshiptypeviews = rtviews;
        }

        // Postprocess relshiptypes
        const reltypes = this.relshiptypes;
        for (let i = 0; i < reltypes?.length; i++) {
            const rtype = reltypes[i];
            const stypes = rtype.findSupertypes(0);
            for (let j = 0; j < stypes?.length; j++) {
                const stype = stypes[j];
                rtype.addSupertype(stype);
            }
        }

        // Postprocess the annotates typeview
        let reltypeview = null;
        const rtype = this.findRelationshipTypeByName(constants.types.AKM_ANNOTATES);
        if (rtype) {
            const rtview = this.findRelationshipTypeView(rtype.typeview?.id);
            if (rtview)
                reltypeview = rtview;
        }
        for (let i = 0; i < mmodels?.length; i++) {
            const metamodel = mmodels[i];
            const rtypes = metamodel.relshiptypes;
            for (let j = 0; j < rtypes?.length; j++) {
                const rtype = rtypes[j];
                if (rtype.name === 'annotates') {
                    rtype.typeview = reltypeview;
                }
            }
        }
    }
    initImport(importedData: any, includeDeleted: boolean) {
        this.allowGenerateCurrentMetamodel = importedData.allowGenerateCurrentMetamodel;
        // Import metamodels
        if (debug) console.log('304 importedData', importedData);
        const metamodels = (importedData) && importedData.metamodels;
        const mmodels = new Array();
        const len = metamodels.length;
        if (metamodels && metamodels.length) {
            for (let i = len - 1; i >= 0; i--) {
                const item = metamodels[i];
                if (item && item.id && (includeDeleted || !item.markedAsDeleted)) {
                    const metamodel = (item) && new cxMetaModel(item.id, item.name, item.description);
                    metamodel.markedAsDeleted = item?.markedAsDeleted;
                    metamodel.layout = item.layout;
                    metamodel.routing = item.routing;
                    metamodel.linkcurve = item.linkcurve;
                    metamodel.generatedFromModelRef = item.generatedFromModelRef;
                    metamodel.includeInheritedReltypes = item.includeInheritedReltypes;
                    this.addMetamodel(metamodel);
                    // Metamodel content
                    let items = item.subModels;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.markedAsDeleted) {
                                const subModel = new cxModel(item.id, item.name, item.description);
                                metamodel.addSubModel(subModel);
                                this.addSubModel(subModel);
                            }
                        }
                    }
                    items = item.datatypes;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (item.name === 'today') continue
                            if (includeDeleted || !item.markedAsDeleted) {
                                const dtype = new cxDatatype(item.id, item.name, item.description);
                                if (dtype.name === 'time') dtype.fieldType = 'time';
                                metamodel.addDatatype(dtype);
                                this.addDatatype(dtype);
                            }
                        }
                    }
                    items = item.properties;
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (includeDeleted || !item.markedAsDeleted) {
                                const prop = new cxProperty(item.id, item.name, item.description);
                                prop.datatypeRef = item.datatypeRef;
                                metamodel.addProperty(prop);
                                this.addProperty(prop);
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
                    metamodel.relshiptypeviews = [];
                    items = item.relshiptypeviews;
                    if (items) items.sort(utils.compare);
                    if (items && items.length) {
                        for (let i = 0; i < items.length; i++) {
                            const item1 = items[i];
                            const item2 = item[i + 1];
                            if (item2?.name === item1.name && item2?.typeRef === item1.typeRef) {
                                item1.markedAsDeleted = true;
                                continue;
                            }
                        }
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
                    mmodels.push(metamodel);
                }
            }
        }
        this.metamodels = mmodels;
        if (debug) console.log('471 metamodels, mmodels', metamodels, mmodels);
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

                            // Objects, relationships and ports
                            let objs = item.objects;
                            if (objs && objs.length) {
                                for (let i = 0; i < objs.length; i++) {
                                    const item = objs[i];
                                    if (!item) continue;
                                    if (includeDeleted || !item.markedAsDeleted) {
                                        const obj = new cxObject(item.id, item.name, null, item.description);
                                        if (!obj) continue;
                                        for (let k in item) {
                                            obj[k] = item[k];
                                        }
                                        model.addObject(obj);
                                        this.addObject(obj);
                                    }
                                }
                            }
                            let rels = item.relships;
                            if (rels && rels.length) {
                                for (let i = 0; i < rels.length; i++) {
                                    const item = rels[i];
                                    if (item && (includeDeleted || !item.markedAsDeleted)) {
                                        const rel = new cxRelationship(item.id, null, null, null, item.name, item.description);
                                        if (!rel) continue;
                                        for (let k in item) {
                                            rel[k] = item[k];
                                        }
                                        model.addRelationship(rel);
                                        this.addRelationship(rel);
                                    }
                                }
                            }
                            // let ports = item.ports;
                            // if (ports && ports.length) {
                            //     for (let i = 0; i < ports.length; i++) {
                            //         const item = ports[i];
                            //         if (includeDeleted || !item.markedAsDeleted) { 
                            //             const port = new cxPort(item.id, item.name, item.description);
                            //             for (let k in item) {
                            //                 port[k] = item[k];
                            //             }
                            //             if (!port) continue;
                            //             model.addPort(port);
                            //             this.addPort(port);
                            //         }
                            //     }
                            // }
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
                                        mv.showRelshipNames = item.showRelshipNames;
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
                                                    objview.markedAsDeleted = item.markedAsDeleted;
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
                                                if (item && (includeDeleted || !item.markedAsDeleted)) {
                                                    const relview = new cxRelationshipView(item.id, item.name, null, item.description);
                                                    if (!relview) continue;
                                                    mv.addRelationshipView(relview);
                                                    this.addRelationshipView(relview);
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
                if (reltypeview) {
                    if (reltypeview.name !== 'undefined_undefined')
                        this.importRelshipTypeView(reltypeview, vstyle);
                }
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
        let datatypes: any[] = item.datatypes;
        if (datatypes && datatypes.length) {
            datatypes.forEach(datatype => {
                if (datatype)
                    this.importDatatype(datatype, metamodel);
            });
        }
        let properties: any[] = item.properties;
        if (properties && properties.length) {
            properties.forEach(prop => {
                if (prop)
                    this.importProperty(prop, metamodel);
            })
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
        if (debug) console.log('666 this', this);
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
        let objtypegeos: any[] = item.objtypegeos;
        if (objtypegeos && objtypegeos.length) {
            objtypegeos.forEach(objtypegeo => {
                if (objtypegeo)
                    this.importObjectTypegeo(objtypegeo, metamodel);
            });
            metamodel.purgeObjtypeGeos();
        }
        let objecttypeviews: any[] = item.objecttypeviews;
        if (objecttypeviews && objecttypeviews.length) {
            objecttypeviews.forEach(objtypeview => {
                if (objtypeview)
                    this.importObjectTypeView(objtypeview, metamodel);
            });
        }

        let relshiptypes: any[] = item.relshiptypes;
        if (relshiptypes && relshiptypes.length) {
            relshiptypes.forEach(reltype => {
                if (debug) console.log('371 reltype', reltype);
                if (reltype) {
                    this.importRelshipType(reltype, metamodel);
                }
            });
        }
        let relshiptypes0: any[] = item.relshiptypes0;
        if (relshiptypes0 && relshiptypes0.length) {
            relshiptypes0.forEach(reltype0 => {
                let reltype = this.findRelationshipType(reltype0?.id);
                if (reltype) {
                    if (reltype.name !== constants.types.AKM_RELSHIP_TYPE
                        && reltype.name !== constants.types.AKM_IS) {
                        if (!reltype) {
                            this.addRelationshipType(reltype0);
                        }
                        metamodel.addRelationshipType0(reltype);
                    }
                }
            });
        }
        let relshiptypeviews = item.relshiptypeviews;
        if (relshiptypeviews && relshiptypeviews.length) {
            relshiptypeviews.forEach(reltypeview => {
                if (reltypeview) {
                    if (reltypeview.name !== 'undefined_undefined')
                        this.importRelshipTypeView(reltypeview, metamodel);
                }
            });
        }
        let rtvs = metamodel.relshiptypeviews;
        rtvs.sort(utils.compare);
        for (let i = 0; i < rtvs.length; i++) {
            const item1 = rtvs[i];
            const item2 = rtvs[i + 1];
            if (item2?.name === item1.name && item2?.typeRef === item1.typeRef) {
                item1.markedAsDeleted = true;
            }
        }
        // Fix reltypeviews in metamodels (patch)
        for (let i = 0; i < this.metamodels?.length; i++) {
            const metamodel = this.metamodels[i];
            const rts = metamodel.relshiptypes;
            for (let j = 0; j < rts?.length; j++) {
                const rt = rts[j];
                const rt2 = this.findRelationshipType(rt.id);
                if (rt2 && rt2.typeview) {
                    rt.typeview = rt2.typeview;
                }
            }
        }
        { // Purge deleted reltypeviews
            const reltypeviews = metamodel.relshiptypeviews;
            const len = metamodel.relshiptypeviews?.length;
            for (let i = len - 1; i >= 0; i--) {
                const reltypeview = reltypeviews[i];
                if (reltypeview.markedAsDeleted) {
                    reltypeviews.splice(i, 1);
                }
            }
        }

        metamodel.includeInheritedReltypes = item.includeInheritedReltypes;
        metamodel.includeSystemtypes = item.includeSystemtypes;
        let containedMetamodelRefs = item.metamodelRefs;
        if (containedMetamodelRefs && containedMetamodelRefs.length) {
            containedMetamodelRefs.forEach(containedMetamodelRef => {
                if (containedMetamodelRef) {
                    const containedMetamodel = this.findMetamodel(containedMetamodelRef);
                    if (containedMetamodel) {
                        metamodel.addMetamodel(containedMetamodel);
                    }
                }
            });
        }
        let subMetamodelRefs = item.subMetamodelRefs;
        if (subMetamodelRefs && subMetamodelRefs.length) {
            subMetamodelRefs.forEach(subMetamodelRef => {
                if (subMetamodelRef) {
                    metamodel.addSubMetamodelRef(subMetamodelRef);
                }
            });
        }
        let subModelRefs = item.subModelRefs;
        if (subModelRefs && subModelRefs.length) {
            subModelRefs.forEach(subModelRef => {
                if (subModelRef) {
                    const subModel = this.findModel(subModelRef);
                    if (subModel) {
                        metamodel.addSubModel(subModel);
                    }
                }
            });
        }
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
            objtype.markedAsDeleted = item.markedAsDeleted;
            let otype = (objtype as cxObjectType);
            for (const prop in item) {
                otype[prop] = item[prop];
            }
            objtype = otype;
            if (item.typeviewRef) {
                const objtypeview = this.findObjectTypeView(item.typeviewRef);
                if (objtype && objtypeview)
                    objtype.setDefaultTypeView(objtypeview);
                if (objtypeview) {
                    metamodel.addObjectTypeView(objtypeview);
                }
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
                        const reltypeview = new cxRelationshipTypeView(id, "", reltype, "");
                        this.addRelationshipTypeView(reltypeview);
                        metamodel.addRelationshipTypeView(reltypeview);
                        reltype.typeview = reltypeview;
                    }
                }
                // Import properties
                const properties: any[] = item.properties;
                if (properties && properties.length) {
                    properties.forEach(p => {
                        const prop = p as cxProperty;
                        if (prop) this.importProperty(prop, metamodel);
                    });
                }
            }
            metamodel.addRelationshipType(reltype);
            if (debug) console.log('485 reltype', reltype, metamodel, this);
        }
    }
    importObjectTypeView(item: any, parent: cxMetaModel | cxViewStyle) {
        const objtypeview = this.findObjectTypeView(item.id);
        const typeref = item.typeRef;
        const type = this.findObjectType(typeref);
        if (!item.template) item.template = constants.gojs.C_NODETEMPLATE;
        if (!item.geometry) item.geometry = "";
        if (objtypeview && type) {
            objtypeview.setMarkedAsDeleted(item.markedAsDeleted);
            objtypeview.setStrokewidth(item.strokewidth);
            objtypeview.setType(type);
            objtypeview.setTemplate(item.template);
            objtypeview.setViewKind(item.viewkind);
            objtypeview.setMemberscale(item.memberscale);
            // objtypeview.setGeometry(item.geometry);
            // objtypeview.setFigure(item.figure);
            objtypeview.setFillcolor(item.fillcolor);
            objtypeview.setFillcolor2(item.fillcolor2);
            objtypeview.setTextcolor(item.textcolor);
            objtypeview.setTextcolor2(item.textcolor2);
            objtypeview.setTextscale(item.textscale);
            objtypeview.setStrokecolor(item.strokecolor);
            objtypeview.setStrokecolor2(item.strokecolor2);
            objtypeview.setStrokewidth(item.strokewidth);
            objtypeview.setIcon(item.icon);
            objtypeview.setImage(item.image);
            objtypeview.setGrabIsAllowed(item.grabIsAllowed);
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
        if (!item.template) item.template = constants.gojs.C_LINKEMPLATE;
        if (reltypeview && type) {
            reltypeview.setMarkedAsDeleted(item.markedAsDeleted);
            reltypeview.setType(type);
            reltypeview.setName(item.name);
            reltypeview.setTemplate(item.template);
            reltypeview.setStrokecolor(item.strokecolor);
            reltypeview.setTextcolor(item.textcolor);
            reltypeview.setStrokewidth(item.strokewidth);
            reltypeview.setDash(item.dash);
            reltypeview.setFromArrow(item.fromArrow);
            reltypeview.setToArrow(item.toArrow);
            reltypeview.setFromArrowColor(item.fromArrowColor);
            reltypeview.setToArrowColor(item.toArrowColor);
            reltypeview.setCurve(item.curve);
            reltypeview.setCorner(item.corner);
            reltypeview.setRouting(item.routing);
            parent.addRelationshipTypeView(reltypeview);
            if (debug) console.log("929 item.id, item.name, reltypeview: " + item.id + ", " + item.name, reltypeview);
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
                    let mtd = (mtype as cxMethodType);
                    if (prop === 'properties') {
                        let properties: cxProperty[] = [];
                        for (let i = 0; i < item.properties.length; i++) {
                            const prop = item.properties[i];
                            const property = this.findProperty(prop.id);
                            if (property) {
                                properties.push(property);
                            }
                            mtd[prop] = properties;
                        }
                    } else
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
                if (objects && objects.length > 0) {
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
                        if (mv.id) {
                            if (model) this.importModelView(mv, model);
                        }
                    });
                }
                model.includeRelshipkind = item.includeRelshipkind;
                model.targetMetamodelRef = item.targetMetamodelRef;
                model.sourceModelRef = item.sourceModelRef;
                model.targetModelRef = item.targetModelRef;
                model.args1 = item.args1;
            }
            const ports = item.ports;
            if (ports && ports.length) {
                ports.forEach(port => {
                    if (model) this.importPort(port, model);
                });
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
        if (!item) return; // sf 2023-05-09
        const rel = this.findRelationship(item.id);
        if (rel) {
            const reltype = this.findRelationshipType(item.typeRef);
            if (debug) console.log('948 item, rel', item, rel);
            const fromObj = this.findObject(item.fromobjectRef);
            const toObj = this.findObject(item.toobjectRef);
            if (reltype && fromObj && toObj) {
                rel.setType(reltype);
                rel.setFromObject(fromObj);
                rel.setToObject(toObj);
                fromObj.addOutputrel(rel);
                toObj.addInputrel(rel);
                rel.fromPortid = item.fromPortid;
                rel.toPortid = item.toPortid;
                rel.relshipkind = item.relshipkind;
                rel.cardinality = item.cardinality;
                rel.cardinalityFrom = item.cardinalityFrom;
                rel.cardinalityTo = item.cardinalityTo;
                rel.markedAsDeleted = item.markedAsDeleted;
                rel.generatedTypeId = item.generatedTypeId;
                if (debug) console.log('966 fromObj, toObj, rel', fromObj, toObj, rel);
                if (model)
                    model.addRelationship(rel);
            } else {
                rel.typeName = item.typeName;
            }
        }
    }
    importPort(item: any, model: cxModel | null) {
        const port = this.findPort(item.id);
        if (port) {
            port.markedAsDeleted = item.markedAsDeleted;
            if (model) {
                model.addPort(port);
            }
        }
    }
    importModelView(item: any, model: cxModel) {
        if (model) {
            const modelview = this.findModelView(item.id);
            if (modelview) {
                modelview.layout = item.layout;
                modelview.showCardinality = item.showCardinality;
                modelview.showRelshipNames = item.showRelshipNames;
                modelview.askForRelshipName = item.askForRelshipName;
                modelview.includeInheritedReltypes = item.includeInheritedReltypes;
                modelview.viewstyle = this.findViewStyle(item.viewstyleRef);
                model.addModelView(modelview);
                const objectviews: cxObjectView[] = (item) && item.objectviews;
                objectviews?.forEach(objview => {
                    if (objview && objview.id) {
                        this.importObjectView(objview, modelview);
                        if (debug) console.log('630 model', model);
                    }
                });
                const relshipviews: cxRelationshipView[] = item.relshipviews;
                relshipviews?.forEach(relview => { // sf added ? 2021-05-09
                    if (relview && relview.id)
                        this.importRelshipView(relview, modelview);
                });
            }
        }
    }
    importObjectView(item: any, modelview: cxModelView) {
        if (modelview) {
            const objview = this.findObjectView(item.id);
            if (objview) {
                if (debug) console.log('1170 item, objview', item, objview);
                const object = this.findObject(item.objectRef);
                if (object) {
                    if (debug) console.log('1173 item.markedAsDeleted', item.markedAsDeleted);
                    objview.setObject(object);
                    objview.setIcon(item.icon);
                    objview.setLoc(item.loc);
                    objview.setSize(item.size);
                    objview.setScale(item.scale);
                    objview.setTextscale(item.textscale);
                    objview.setGroup(item.group);
                    objview.setIsGroup(item.isGroup);
                    objview.setGroupIsExpanded(item.isExpanded);
                    objview.setMarkedAsDeleted(item.markedAsDeleted);
                    objview.fillcolor = item.fillcolor;
                    objview.fillcolor2 = item.fillcolor2;
                    objview.strokecolor = item.strokecolor;
                    objview.strokecolor2 = item.strokecolor2;
                    objview.strokewidth = item.strokewidth;
                    objview.textcolor = item.textcolor;
                    objview.textcolor2 = item.textcolor2;
                    objview.textscale = item.textscale;
                    objview.viewkind = item.viewkind;
                    objview.groupLayout = item.groupLayout;
                    if (item.isExpanded == undefined) {
                        if (item.isCollapsed !== undefined)
                            objview.isExpanded = !item.isCollapsed;
                    }
                    objview.isSelected = item.isSelected;
                    objview.text = item.text;
                    objview.modified = true;
                    if (debug) console.log('1188 objview', objview);
                    if (item.typeviewRef) {
                        const objtypeview = this.findObjectTypeView(item.typeviewRef);
                        if (objtypeview) {
                            objview.setTypeView(objtypeview);
                            const viewdata = objtypeview.getData();
                            for (let prop in viewdata) {
                                // Default values are typeview values
                                if (item[prop] && item[prop] !== "") {
                                    // Item values are overrides
                                    objview[prop] = item[prop];
                                }
                            }
                        }
                    }
                    objview.viewkind = item.viewkind;
                    if (debug) console.log('1201 objview.markedAsDeleted', objview.markedAsDeleted, objview);
                    object.addObjectView(objview);
                    if (debug) console.log('1203 item, objview', item, objview);
                }
                modelview.removeObjectView(objview);
                if (debug) console.log('1206 modelview', objview.markedAsDeleted, objview, modelview);
                modelview.addObjectView(objview);
                if (debug) console.log('1208 modelview', objview.markedAsDeleted, objview, modelview);
            }
        }
    }
    importRelshipView(item: any, modelview: cxModelView) {
        if (modelview) {
            if (debug) console.log('1034 item (relshipview): ', item);
            if (item.markedAsDeleted === "")
                item.markedAsDeleted = false;
            const relview = this.findRelationshipView(item.id);
            if (relview) {
                const relship = this.findRelationship(item.relshipRef);
                if (relship) {
                    relview.setRelationship(relship);
                    const fromobjview = modelview.findObjectView(item.fromobjviewRef) as cxObjectView;
                    const toobjview = modelview.findObjectView(item.toobjviewRef) as cxObjectView;
                    if (!fromobjview || !toobjview)
                        return;
                    relview.setFromObjectView(fromobjview);
                    relview.setToObjectView(toobjview);
                    fromobjview.addOutputRelview(relview);
                    toobjview.addInputRelview(relview);
                    relview.fromPortid = relship.fromPortid;
                    relview.toPortid = relship.toPortid;
                    relview.template = item.template;
                    relview.arrowscale = item.arrowscale;
                    relview.strokecolor = item.strokecolor;
                    relview.strokewidth = item.strokewidth;
                    relview.textcolor = item.textcolor;
                    relview.textscale = item.textscale;
                    relview.dash = item.dash;
                    relview.fromArrow = item.fromArrow;
                    relview.toArrow = item.toArrow;
                    relview.fromArrowColor = item.fromArrowColor;
                    relview.toArrowColor = item.toArrowColor;
                    relview.routing = item.routing;
                    relview.corner = item.corner;
                    relview.curve = item.curve;
                    relview.points = item.points;
                    relview.visible = item.visible;
                    let reltypeview;
                    if (item.typeviewRef) {
                        reltypeview = this.findRelationshipTypeView(item.typeviewRef);
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
                    if (!reltypeview) {
                        reltypeview = relview.relship?.type?.typeview as cxRelationshipTypeView;
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
                    relview.markedAsDeleted = item.markedAsDeleted;
                    relview.template = item.template;
                    relship.addRelationshipView(relview);
                    modelview.addRelationshipView(relview);
                }
            }
        }
    }
    addMetamodel(metamodel: cxMetaModel) {
        if (metamodel.category === constants.gojs.C_METAMODEL) {
            if (this.metamodels == null)
                this.metamodels = new Array();
            let mm = this.findMetamodel(metamodel.id);
            if (!mm)
                this.metamodels.push(metamodel);
            else 
                mm = metamodel;
            // else {
            //     const mms = this.metamodels;
            //     const len = mms?.length;
            //     for (let i = len; i > 0; i--) {
            //         const mm = mms[i-1];
            //         if (mm.id === metamodel.id) {
            //             mms[i-1] = metamodel;
            //             break;
            //         }
            //     }
            // }
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
    addSubModel(model: cxModel) {
        // Check if input is of correct category and not already in list (TBD)
        if (model?.category === constants.gojs.C_MODEL) {
            if (this.submodels == null)
                this.submodels = new Array();
            if (!this.findSubModel(model.id))
                this.submodels.push(model);
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
            if (this.properties == null)
                this.properties = new Array();
            if (!this.findProperty(prop.id))
                this.properties.push(prop);
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
                for (let i = 0; i < len; i++) {
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
                for (let i = 0; i < len; i++) {
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
            if (!this.findRelationshipType(reltype.id)) {
                this.fixObjectTypeRefs(reltype);
                this.relshiptypes.push(reltype);
                if (debug) console.log('1438 Add reltype', reltype);
            }
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
                for (let i = 0; i < len; i++) {
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
            } else {
                // Relship typeview is already in list, copy values
                const len = this.relshiptypeviews.length;
                for (let i = 0; i < len; i++) {
                    const rtview = this.relshiptypeviews[i];
                    if (debug) console.log('1378 rtview', rtview);
                    if (rtview.id === reltypeview.id) {
                        for (let prop in reltypeview) {
                            if (prop === 'id') continue;
                            if (prop === 'name') continue;
                            if (prop === 'data') continue;
                            if (prop === 'typeRef') continue;
                            rtview[prop] = reltypeview[prop];
                            rtview.data[prop] = reltypeview[prop];
                        }
                        if (debug) console.log('1387 rtview', rtview);
                        break;
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
                for (let i = 0; i < len; i++) {
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
    // addPort(obj: cxPort) {
    //     if (obj.category === constants.gojs.C_PORT) {
    //         if (this.ports == null)
    //             this.ports = new Array();
    //         if (!this.findPort(obj.id))
    //             this.ports.push(obj);
    //         else {
    //             const ports = this.ports;
    //             for (let i = 0; i < ports.length; i++) {
    //                 const port = ports[i];
    //                 if (port.id === obj.id) {
    //                     ports[i] = obj;
    //                     break;
    //                 }
    //             }
    //         }
    //     }
    // }
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
    getSubModels(): cxModel[] | null {
        return this.submodels;
    }
    getModelsByMetamodel(metamodel: cxMetaModel, includeDeleted: boolean): cxModel[] {
        let models = new Array();
        const mdls = this.models;
        for (let i = 0; i < mdls.length; i++) {
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
            const lng = mdls.length;
            for (let i = 0; i < lng; i++) {
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
                const lng = mviews.length;
                for (let i = 0; i < lng; i++) {
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
                const lng = mviews.length;
                for (let i = 0; i < lng; i++) {
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
            const lng = mviews.length;
            for (let i = 0; i < lng; i++) {
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
                    if (type && type.id === reltype?.id)
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
    // getPorts(): cxPort[] | null {
    //     return this.ports;
    // }
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
    findSubModel(id: string): cxModel | null {
        let submodels = this.submodels;
        if (!submodels) return null;
        let i = 0;
        let submodel = null;
        for (i = 0; i < submodels.length; i++) {
            submodel = submodels[i];
            if (submodel.isDeleted()) continue;
            if (submodel.id === id)
                return submodel;
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
                    if (objtype.id === id) {
                        if (!objtype.markedAsDeleted)
                            return objtype;
                    }
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
                if (objtype?.getName() === name) {
                    if (!objtype.markedAsDeleted)
                        return objtype;
                }
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
                if (objecttypeview?.id === id) {
                    if (!objecttypeview.markedAsDeleted)
                        return objecttypeview;
                }
                i++;
            }
        }
        return null;
    }
    getObjectTypeViewsByObjectType(objtype: cxObjectType): cxObjectTypeView[] | null {
        const typeviews = this.getObjectTypeViews();
        if (!typeviews) {
            return null;
        } else {
            let i = 0;
            let objecttypeview: cxObjectTypeView = null;
            const views = new Array();
            while (i < typeviews.length) {
                objecttypeview = typeviews[i];
                if (!objecttypeview?.markedAsDeleted) {
                    if (objecttypeview.typeRef === objtype.id)
                        views.push(objecttypeview);
                }
                i++;
            }
            return views;
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
                if (!objtypegeo?.markedAsDeleted) {
                    if (objtypegeo.id === id)
                        return objtypegeo;
                }
                i++;
            }
        }
        return null;
    }
    findObject(id: string, includeDeleted): cxObject | null {
        const objects = this.getObjects();
        if (!objects) {
            return null;
        } else {
            let i = 0;
            let obj = null;
            while (i < objects.length) {
                obj = objects[i];
                if (!obj?.markedAsDeleted || includeDeleted) {
                    if (obj.id === id)
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
                if (!obj?.markedAsDeleted) {
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
    findObjectView(id: string, includeDeleted: boolean): cxObjectView | null {
        const objectviews = this.getObjectViews();
        if (!objectviews) {
            return null;
        } else {
            let i = 0;
            let objview: cxObjectView = null;
            while (i < objectviews.length) {
                objview = objectviews[i];
                if (!objview?.markedAsDeleted || includeDeleted) {
                    if (objview.id === id) {
                        if (!objview.objectRef) {
                            const obj = objview.object;
                            objview.objectRef = obj?.id;
                        }
                        return objview;
                    }
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
                if (!prop?.markedAsDeleted) {
                    if (prop.id === id)
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
    // findPort(id: string): cxPort | null {
    //     const ports = this.getPorts();
    //     if (!ports) {
    //         return null;
    //     } else {
    //         let i = 0;
    //         let port = null;
    //         while (i < ports.length) {
    //             port = ports[i];
    //             if (port) {
    //                 if (port.id === id)
    //                     return port;
    //             }
    //             i++;
    //         }
    //     }
    //     return null;
    // }
    findMethodType(id: string): cxMethodType | null {
        let mtypes = this.getMethodTypes();
        if (!mtypes)
            return null;
        else {
            let i = 0;
            let mtyp = null;
            while (i < mtypes.length) {
                mtyp = mtypes[i];
                if (!mtyp?.markedAsDeleted) {
                    if (mtyp.id === id)
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
                if (!mtd?.markedAsDeleted) {
                    if (mtd.id === id)
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
                if (!reltype?.markedAsDeleted) {
                    if (reltype.id === id)
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
        // Returns the first with the given name
        // Does not include inheritance
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
        // Does not include inheritance
        const types = this.getRelationshipTypes();
        if (!types) {
            return null;
        } else {
            for (let i = 0; i < types.length; i++) {
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
        // Does include inheritance
        const types = this.getRelationshipTypes();
        if (debug) console.log('2171 types', types.length, types);
        if (!types) {
            return null;
        } else {
            let reltype: cxRelationshipType | null = null;
            for (let i = 0; i < types.length; i++) {
                reltype = types[i];
                if (reltype.isDeleted()) continue;
                if (reltype.getName() === name) {
                    this.fixObjectTypeRefs(reltype);
                    if (reltype.isAllowedFromType(fromObjType, true)) {
                        if (reltype.isAllowedToType(toObjType, true)) {
                            return reltype;
                        }
                    }
                }
            }
        }
        return null;
    }
    findRelationshipTypeByName3(name: string, fromObjType: cxObjectType, toObjType: cxObjectType, entityType: cxObjectType): cxRelationshipType | null {
        // Includes check inheritance
        const types = this.getRelationshipTypes();
        if (debug) console.log('2171 types', types.length, types);
        if (!types) {
            return null;
        } else {
            let reltype: cxRelationshipType | null = null;
            for (let i = 0; i < types.length; i++) {
                reltype = types[i];
                if (debug) console.log('2178 reltype', reltype, fromObjType, toObjType);
                if (reltype.isDeleted()) continue;
                if (reltype.getName() === name) {
                    this.fixObjectTypeRefs(reltype);
                    if ((fromObjType.id === entityType.id) ||
                        reltype.isAllowedFromType(fromObjType, true)) {
                        if ((toObjType.id === entityType.id) ||
                            reltype.isAllowedToType(toObjType, true))
                            return reltype;
                    }
                    if ((toObjType.id === entityType.id) ||
                        reltype.isAllowedToType(toObjType, true)) {
                        if ((fromObjType.id === entityType.id) ||
                            reltype.isAllowedFromType(fromObjType, true))
                            return reltype;
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
    findRelationshipTypesBetweenTypes0(fromType: cxObjectType, toType: cxObjectType): cxRelationshipType[] | null {
        let reltypes = new Array();
        let rtypes = this.getRelationshipTypes();
        if (!rtypes) return null;
        for (let i = 0; i < rtypes.length; i++) {
            let reltype = rtypes[i];
            if (reltype.getRelshipKind() !== constants.relkinds.GEN &&
                reltype.name !== constants.types.AKM_IS) {
                continue;
            }
            if (reltype.isDeleted()) continue;

            let fromObjtype = reltype.getFromObjType();
            if (!fromObjtype) {
                fromObjtype = this.findObjectType(reltype.fromobjtypeRef);
            }
            if (!fromType.inherits(fromObjtype))
                continue;
            let toObjtype = reltype.getToObjType();
            if (!fromObjtype) {
                toObjtype = this.findObjectType(reltype.toobjtypeRef);
            }
            if (!toType.inherits(toObjtype))
                continue;
            reltypes.push(reltype);
        }
        return reltypes;
    }
    findRelationshipTypesBetweenTypes(fromType: cxObjectType, toType: cxObjectType, includeGen: boolean): cxRelationshipType[] | null {
        if (!fromType || !toType)
            return null;
        let types = this.getRelationshipTypes();
        if (!types) return null;
        let reltypes = new Array();
        for (let i = 0; i < types.length; i++) {
            let reltype = types[i];
            this.fixObjectTypeRefs(reltype);
        }
        for (let i = 0; i < types.length; i++) {
            let reltype = types[i];
            if (reltype) {
                if (reltype.isDeleted()) continue;
                if (reltype.name === constants.types.AKM_IS) continue;
                const fromObjType = reltype.getFromObjType();
                const toObjType = reltype.getToObjType();
                if (fromObjType && toObjType) {
                    if (reltype.name === constants.types.AKM_RELATIONSHIP_TYPE) {
                        if (fromType.name === constants.types.AKM_ENTITY_TYPE &&
                            toType.name === constants.types.AKM_ENTITY_TYPE) {
                            reltypes.push(reltype);
                            continue;
                        } else
                            continue;
                    }
                    if (fromType.inherits(fromObjType) && toType.inherits(toObjType)) {
                        // if (fromObjType.id === toObjType.id) {
                        if (fromObjType.name === constants.types.AKM_ENTITY_TYPE) {
                            if (includeGen)
                                reltypes.push(reltype);
                        } else
                            reltypes.push(reltype);
                        continue;
                        // }
                    }
                }
                if (reltype.relshipkind === constants.relkinds.GEN) continue;
                if (reltype.isAllowedFromType(fromType, includeGen)) {
                    if (reltype.isAllowedToType(toType, includeGen)) {
                        reltypes.push(reltype);
                    }
                }
            }
        }
        return reltypes;
    }
    findRelationshipTypesBetweenTypes1(fromType: cxObjectType, toType: cxObjectType, includeGen): cxRelationshipType[] | null {
        if (!fromType || !toType)
            return null;
        let rtypes = this.getRelationshipTypes();
        if (!rtypes) return null;
        for (let i = 0; i < rtypes.length; i++) {
            let reltype = rtypes[i];
            this.fixObjectTypeRefs(reltype);
        }
        for (let i = 0; i < rtypes.length; i++) {
            let reltype = rtypes[i];
            if (reltype) {
                if (reltype.isDeleted()) continue;
                let fromObjtype = reltype.getFromObjType();
                if (!fromObjtype) {
                    fromObjtype = this.findObjectType(reltype.fromobjtypeRef);
                }
                let toObjtype = reltype.getToObjType();
                if (!toObjtype) {
                    toObjtype = this.findObjectType(reltype.toobjtypeRef);
                }
                this.fixObjectTypeRefs(reltype);
                if (reltype.isAllowedFromType(fromObjtype, includeGen)) {
                    if (reltype.isAllowedToType(toObjtype, includeGen)) {
                        reltypes.push(reltype);
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
                if (!relshiptypeview?.markedAsDeleted) {
                    if (relshiptypeview.id === id)
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
                if (!rel?.markedAsDeleted) {
                    if (rel.id === id)
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
                if (!relview?.markedAsDeleted) {
                    if (relview.id === id)
                        return relview;
                }
                i++;
            }
        }
        return null;
    }
    findSubMetamodel(id: string): cxModel | null {
        if (debug) console.log('2834 findSubMetamodel', id, this, this.currentMetamodel);
        let metamodels = this.currentMetamodel?.getSubMetamodels();
        if (debug) console.log('2836 findSubMetamodel', metamodels);
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
        this.currentMetamodelRef = metamodel?.id;
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
    fixObjectTypeRefs(reltype: cxRelationshipType) {
        if (!reltype.fromObjtype) {
            if (reltype.fromobjtypeRef) {
                const objtype = this.findObjectType(reltype.fromobjtypeRef);
                if (objtype) {
                    reltype.fromObjtype = objtype;
                }
            }
        }
        if (!reltype.toObjtype) {
            if (reltype.toobjtypeRef) {
                const objtype = this.findObjectType(reltype.toobjtypeRef);
                if (objtype) {
                    reltype.toObjtype = objtype;
                }
            }
        }
    }
    purgeObjectTypeViews(): cxObjectTypeView[] | null {
        const metamodels = this.getMetamodels();
        for (let i = 0; i < metamodels.length; i++) {
            let metamodel = metamodels[i];
            const objecttypes = metamodel.getObjectTypes();
            for (let j = 0; j < objecttypes.length; j++) {
                let objtype = this.objecttypes[j];
                const typeviewRef = objtype.typeview.id;
                const typeviews = metamodel.getObjectTypeViewsByObjectType(objtype);
                if (typeviews.length < 2) continue;
                for (let k = 0; k < typeviews.length; k++) {
                    let tview = typeviews[k];
                    if (tview.id !== typeviewRef) {
                        tview.markedAsDeleted = true;
                    }
                }
            }
        }
        return null;
    }
    removeClassInstances(sel: any) {
        if (sel.objectview) sel.objectview = null;
        if (sel.object) sel.object = null;
        if (sel.objecttype) sel.objecttype = null; 
        if (sel.typeview) sel.typeview = null; 
        if (sel.leftPorts) sel.leftPorts = null;
        if (sel.rightPorts) sel.rightPorts = null;
        if (sel.topPorts) sel.topPorts = null;
        if (sel.bottomPorts) sel.bottomPorts = null;
        if (sel.relshipview) sel.relshipview = null;
        if (sel.relship) sel.relship = null;
        if (sel.relshiptype) sel.relshiptype = null;
        if (sel.typeview) sel.typeview = null;
        if (sel.fromNode) sel.fromNode = null;
        if (sel.toNode) sel.toNode = null;
        if (sel.fromObjview) sel.fromObjview = null;
        if (sel.toObjview) sel.toObjview = null;
        return sel;
    }
    substituteNodeMapValues(nodemaps: any, from, to) {
        for (let i = 0; i < nodemaps.length; i++) {
            let nodemap = nodemaps[i];
            if (nodemap.to === from) 
                nodemap.to = to;
            if (nodemap.fromGroup === from) 
                nodemap.fromGroup = to;
        }
    }
}

// -------  cxMetaObject - Den mest supre av alle supertyper  ----------------

export class cxMetaObject {
    id: string;
    name: string;
    nameId: string;
    category: string;
    description: string;
    sourceUri: string;
    markedAsDeleted: boolean;
    modified: boolean;
    // Constructor
    constructor(id: string, name: string, description: string) {
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
        this.markedAsDeleted = deleted;
    }
    getMarkedAsDeleted(): boolean {
        return this.markedAsDeleted;
    }
    setDeleted(deleted: boolean) {
        this.markedAsDeleted = deleted;
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
    updateContent(inst: any) {
        for (let prop in inst) {
            // console.log('3166 prop, inst[prop]', prop, inst[prop]);
            this[prop] = inst[prop];
        }
    }
}

// --------  cxProject ---------------------------------------------------
export class cxProject extends cxMetaObject {
    metamodels: cxMetaModel[] | null;
    models: cxModel[];
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
                for (let i = 0; i < mms.length; i++) {
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
                }
                i++;
            }
        }
        return null;
    }
}

// ---------  Data Types, Categories and Units --------------------------

export class cxDatatype extends cxMetaObject {
    isOfDatatype: cxDatatype | null;
    allowedValues: string[];   // array of strings
    defaultValue: string;
    value: string;
    inputPattern: string;
    viewFormat: string;
    fieldType: string;
    readOnly: boolean;
    pointerType: cxObjectType;
    pointerCriteria: string;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_DATATYPES;  // Firestore collection
        this.category = constants.gojs.C_DATATYPE;
        this.isOfDatatype = null;
        this.inputPattern = "";
        this.viewFormat = "";
        this.fieldType = "text";
        this.readOnly = false;
        this.allowedValues = null;
        this.defaultValue = "";
        this.value = "";
        this.pointerType = null;
        this.pointerCriteria = "";

        if (debug) console.log('1915 datatype: ', this);
        // Initialize inputPatterns of common datatypes
        if (name === constants.gojs.C_DATATYPE_STRING) {
            this.inputPattern = constants.gojs.C_DATATYPE_STRING_PATTERN;
            this.viewFormat = constants.gojs.C_VIEWFORMAT_TEXT;
        } else if (name === constants.gojs.C_DATATYPE_INTEGER) {
            this.inputPattern = constants.gojs.C_DATATYPE_INTEGER_PATTERN;
            this.viewFormat = constants.gojs.C_VIEWFORMAT_INTEGER;
        } else if (name === constants.gojs.C_DATATYPE_FLOAT) {
            this.inputPattern = constants.gojs.C_DATATYPE_FLOAT_PATTERN;
            this.viewFormat = constants.gojs.C_VIEWFORMAT_FLOAT;
        } else if (name === constants.gojs.C_DATATYPE_DATE) {
            this.inputPattern = constants.gojs.C_DATATYPE_DATE_PATTERN;
            this.viewFormat = constants.gojs.C_VIEWFORMAT_DATE;
        } else if (name === constants.gojs.C_DATATYPE_TIME) {
            this.inputPattern = constants.gojs.C_DATATYPE_TIME_PATTERN;
            this.viewFormat = constants.gojs.C_VIEWFORMAT_TIME;
        } else if (name === constants.gojs.C_DATATYPE_DATETIME) {
            this.inputPattern = constants.gojs.C_DATATYPE_DATETIME_PATTERN;
            this.viewFormat = constants.gojs.C_VIEWFORMAT_DATETIME;
        } else if (name === constants.gojs.C_DATATYPE_BOOLEAN) {
            this.inputPattern = constants.gojs.C_DATATYPE_BOOLEAN_PATTERN;
            this.viewFormat = constants.gojs.C_VIEWFORMAT_BOOLEAN;
            /*
            } else if (name === constants.gojs.C_DATATYPE_EMAIL) {
                this.inputPattern = constants.gojs.C_DATATYPE_EMAIL_PATTERN;
                this.viewFormat   = constants.gojs.C_VIEWFORMAT_EMAIL;
            } else if (name === constants.gojs.C_DATATYPE_URL) {
                this.inputPattern = constants.gojs.C_DATATYPE_URL_PATTERN;
                this.viewFormat   = constants.gojs.C_DATATYPE_URL_FORMAT;
            } else if (name === constants.gojs.C_DATATYPE_PHONE) {
                this.inputPattern = constants.gojs.C_DATATYPE_PHONE_PATTERN;
                this.viewFormat   = constants.gojs.C_DATATYPE_PHONE_FORMAT;
            } else if (name === constants.gojs.C_DATATYPE_CURRENCY) {
                this.inputPattern = constants.gojs.C_DATATYPE_CURRENCY_PATTERN;
                this.viewFormat   = constants.gojs.C_DATATYPE_CURRENCY_FORMAT;
            } else if (name === constants.gojs.C_DATATYPE_PERCENTAGE) {
                this.inputPattern = constants.gojs.C_DATATYPE_PERCENTAGE_PATTERN;
                this.viewFormat   = constants.gojs.C_DATATYPE_PERCENTAGE_FORMAT;
            } else if (name === constants.gojs.C_DATATYPE_COLOR) {
                this.inputPattern = constants.gojs.C_DATATYPE_COLOR_PATTERN;
                this.viewFormat   = constants.gojs.C_DATATYPE_COLOR_FORMAT;
            } else if (name === constants.gojs.C_DATATYPE_IMAGE) {
                this.inputPattern = constants.gojs.C_DATATYPE_IMAGE_PATTERN;
                this.viewFormat   = constants.gojs.C_DATATYPE_IMAGE_FORMAT;
            } else if (name === constants.gojs.C_DATATYPE_FILE) {
                this.inputPattern = constants.gojs.C_DATATYPE_FILE_PATTERN;
                this.viewFormat   = constants.gojs.C_DATATYPE_FILE_FORMAT;
            } else if (name === constants.gojs.C_DATATYPE_HTML) {
                this.inputPattern = constants.gojs.C_DATATYPE_HTML_PATTERN;
                this.viewFormat   = constants.gojs.C_DATATYPE_HTML_FORMAT;
            } else if (name === constants.gojs.C_DATATYPE_JSON) {
                this.inputPattern = constants.gojs.C_DATATYPE_JSON_PATTERN;
                this.viewFormat   = constants.gojs.C_DATATYPE_JSON_FORMAT;
            } else if (name === constants.gojs.C_DATATYPE_XML) {
                this.inputPattern = constants.gojs.C_DATATYPE_XML_PATTERN;
                this.viewFormat   = constants.gojs.C_DATATYPE_XML_FORMAT;
            } else if (name === constants.gojs.C_DATATYPE_PASSWORD) {
                this.inputPattern = constants.gojs.C_DATATYPE_PASSWORD_PATTERN;
                this.viewFormat   = constants.gojs.C_DATATYPE_PASSWORD_FORMAT;
            */
        } else {
            this.inputPattern = constants.gojs.C_DATATYPE_STRING_PATTERN;
            this.viewFormat = constants.gojs.C_VIEWFORMAT_TEXT;
        }
    }
    // Methods
    addAllowedValue(value: string) {
        let lng = 0;
        if (utils.objExists(this.allowedValues))
            lng = this.allowedValues.length;
        if (lng == 0) {
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
            if (this.properties == null)
                this.properties = new Array();
            if (!this.findProperty(prop.id))
                this.properties.push(prop);
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
    getProperties(): cxProperty[] | null {
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

export class cxMetaModel extends cxMetaObject {
    metamodels: cxMetaModel[] | null;
    submodels: cxModel[] | null;
    submetamodelRefs: string[] | null;
    submodelRefs: string[] | null;
    viewstyle: cxViewStyle | null;
    viewstyles: cxViewStyle[] | null;
    geometries: cxGeometry[] | null;
    containers: cxMetaContainer[] | null;
    objecttypes: cxObjectType[] | null;
    objtypegeos: cxObjtypeGeo[] | null;
    objecttypeviews: cxObjectTypeView[] | null;
    relshiptypes: cxRelationshipType[] | null;
    relshiptypeviews: cxRelationshipTypeView[] | null;
    objecttypes0: cxObjectType[] | null;
    relshiptypes0: cxRelationshipType[] | null;
    properties: cxProperty[] | null;
    methods: cxMethod[] | null;
    methodtypes: cxMethodType[] | null;
    enumerations: cxEnumeration[] | null;
    units: cxUnit[] | null;
    datatypes: cxDatatype[] | null;
    viewformats: cxViewFormat[] | null;
    fieldTypes: cxFieldType[] | null;
    inputpatterns: cxInputPattern[] | null;
    categories: cxUnitCategory[] | null;
    generatedFromModelRef: string;
    includeInheritedReltypes: boolean;
    includeSystemtypes: boolean;
    layout: string;
    routing: string;
    linkcurve: string;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.category = constants.gojs.C_METAMODEL;
        this.clearContent();
    }
    // Methods
    clearContent() {
        this.metamodels = [];
        this.submodels = [];
        this.submetamodelRefs = [];
        this.submodelRefs = [];
        this.viewstyle = null; // Current viewstyle
        this.viewstyles = [];
        this.geometries = [];
        this.containers = [];
        this.properties = [];
        this.methods = [];
        this.methodtypes = [];
        this.enumerations = [];
        this.units = [];
        this.datatypes = [];
        this.categories = [];
        this.generatedFromModelRef = "";
        this.layout = "ForceDirected";
        this.routing = "Normal";
        this.linkcurve = "None";
        this.includeInheritedReltypes = false;
        this.includeSystemtypes = false;
        this.objecttypes = [];
        this.objecttypes0 = [];
        this.objtypegeos = [];
        this.objecttypeviews = [];
        this.relshiptypes = [];
        this.relshiptypes0 = [];
        this.relshiptypeviews = [];
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
            let lng = this.objecttypes.length;
            if (lng > 0) result += "Object types:<br>"
            for (let i = 0; i < lng; i++) {
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
    getMetamodels(): cxMetaModel[] | null {
        return this.metamodels;
    }
    getContainedMetamodels(): cxMetaModel[] | null {
        return this.metamodels;
    }
    getSubMetamodelRefs(): string[] | null {
        return this.submetamodelRefs;
    }
    getSubModels(): cxModel[] | null {
        return this.submodels;
    }
    getSubModelRefs(): string[] | null {
        return this.submodelRefs;
    }
    getCategories(): cxUnitCategory[] | null {
        return this.categories;
    }
    getDatatypes(): cxDatatype[] | null {
        return this.datatypes;
    }
    getCurrentViewstyle(): cxViewStyle | null {
        return this.viewstyle;
    }
    setCurrentViewstyle(viewstyle: cxViewStyle) {
        this.viewstyle = viewstyle;
        if (!this.findViewStyle(viewstyle.id))
            this.addViewStyle(viewstyle);
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
                if (!type?.markedAsDeleted) {
                    const name = type.getName();
                    if (!utils.nameExistsInNames(names, name))
                        names.push(name);
                }
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
    getObjectTypeViewsByObjectType(objtype: cxObjectType): cxObjectTypeView[] | null {
        const typeviews = this.getObjectTypeViews();
        if (!typeviews) {
            return null;
        } else {
            let i = 0;
            let objecttypeview: cxObjectTypeView = null;
            const views = new Array();
            while (i < typeviews.length) {
                objecttypeview = typeviews[i];
                if (!objecttypeview?.markedAsDeleted) {
                    if (objecttypeview.typeRef === objtype.id)
                        views.push(objecttypeview);
                }
                i++;
            }
            return views;
        }
        return null;
    }

    removeAllObjectTypeViewsByObjectType(objtype: cxObjectType): cxObjectTypeView[] {
        const allTypeviews = this.getObjectTypeViews();
        const typeviews = this.getObjectTypeViewsByObjectType(objtype);
        if (!typeviews) {
            return [];
        }
        // Remove all typeviews in allTypeviews
        for (let i = 0; i < typeviews.length; i++) {
            const typeview = typeviews[i];
            if (typeview) {
                for (let j = 0; j < allTypeviews.length; j++) {
                    const allTypeview = allTypeviews[j];
                    if (allTypeview) {
                        if (allTypeview.id === typeview.id) {
                            allTypeviews.splice(j, 1);
                            break;
                        }
                    }
                }
            }
        }
        return allTypeviews;
    }

    getRelshipTypeViewsByRelshipType(reltype: cxRelationshipType): cxRelationshipTypeView[] | null {
        const typeviews = this.getRelshipTypeViews();
        if (!typeviews) {
            return null;
        } else {
            let i = 0;
            let reltypeview: cxRelationshipTypeView = null;
            const views = new Array();
            while (i < typeviews.length) {
                reltypeview = typeviews[i];
                if (!reltypeview?.markedAsDeleted) {
                    if (reltypeview.typeRef === reltype.id)
                        views.push(reltypeview);
                }
                i++;
            }
            return views;
        }
        return null;
    }

    removeAllRelshipTypeViewsByRelshipType(reltype: cxRelationshipType): cxRelationshipTypeView[] {
        const allTypeviews = this.getRelshipTypeViews();
        const typeviews = this.getRelshipTypeViewsByRelshipType(reltype);
        if (!typeviews) {
            return [];
        }
        // Remove duplicated typeviews in allTypeviews
        for (let i = 0; i < typeviews.length; i++) {
            const typeview = typeviews[i];
            if (typeview) {
                for (let j = 0; j < allTypeviews.length; j++) {
                    const allTypeview = allTypeviews[j];
                    if (allTypeview) {
                        if (allTypeview.id === typeview.id) {
                            allTypeviews.splice(j, 1);
                            break;
                        }
                    }
                }
            }
        }
        return allTypeviews;
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
                    if (type?.getRelshipKind() === constants.relkinds.GEN)
                        continue;
                }
                if (!type?.markedAsDeleted) {
                    const name = type.getName();
                    if (!utils.nameExistsInNames(names, name))
                        names.push(name);
                }
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
    getMetaContainers(): any[] | null {
        return this.containers;
    }
    getUnits(): cxUnit[] | null {
        return this.units;
    }
    addMetamodel(metamodel: cxMetaModel) {
        // Check if input is of correct category and not already in list (TBD)
        if (metamodel?.category === constants.gojs.C_METAMODEL) {
            if (this.metamodels == null)
                this.metamodels = new Array();
            this.metamodels.push(metamodel);
            this.metamodels = [...new Set(this.metamodels)];
        }
    }
    addContainedMetamodel(metamodel: cxMetaModel) {
        // Check if input is of correct category and not already in list (TBD)
        if (metamodel?.category === constants.gojs.C_METAMODEL) {
            if (this.metamodels == null)
                this.metamodels = new Array();
            if (!this.findContainedMetamodel(metamodel.id))
                this.metamodels.push(metamodel);
        }
    }
    addSubMetamodelRef(metamodelRef: string) {
        if (this.submetamodelRefs == null)
            this.submetamodelRefs = new Array();
        if (!this.findSubMetamodelRef(metamodelRef))
            this.submetamodelRefs.push(metamodelRef);
    }
    addMetamodelContent(metamodel: cxMetaModel) {
        // 
        if (this.metamodels == null)
            this.metamodels = new Array();
        const objtypes = metamodel.getObjectTypes();
        if (objtypes) {
            for (let i = 0; i < objtypes.length; i++) {
                const objtype = objtypes[i];
                if (!this.findObjectType(objtype.id))
                    this.objecttypes.push(objtype);
            }
        }
        const reltypes = metamodel.getRelshipTypes();
        if (reltypes) {
            for (let i = 0; i < reltypes.length; i++) {
                const reltype = reltypes[i];
                if (!this.findRelationshipType(reltype.id))
                    this.relshiptypes.push(reltype);
            }
        }
    }
    addSubModel(model: cxModel) {
        // Check if input is of correct category and not already in list (TBD)
        if (model?.category === constants.gojs.C_MODEL) {
            if (this.submodels == null)
                this.submodels = new Array();
            if (!this.findSubModel(model.id))
                this.submodels.push(model);
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
    addObjectType0ByName(objType: cxObjectType) {
        // Check if input is of correct category and not already in list (TBD)
        if (objType.category === constants.gojs.C_OBJECTTYPE) {
            if (this.objecttypes0 == null)
                this.objecttypes0 = new Array();
            if (!this.findObjectType0ByName(objType.name))
                this.objecttypes0.push(objType);
            else {
                const types = this.objecttypes0;
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
    removeObjectType(otype: cxObjectType) {
        if (otype.category === constants.gojs.C_OBJECTTYPE) {
            const objtypes = new Array();
            for (let i = 0; i < this.objecttypes.length; i++) {
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
            if (this.properties == null)
                this.properties = new Array();
            if (!this.findPropertyByName(prop.name))
                this.properties.push(prop);
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
                for (let i = 0; i < len; i++) {
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
                for (let i = 0; i < len; i++) {
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
        if (relType?.category === constants.gojs.C_RELSHIPTYPE) {
            if (this.relshiptypes == null)
                this.relshiptypes = new Array();
            if (!this.findRelationshipType(relType.id)) {
                this.relshiptypes.push(relType);
                if (debug) console.log('3757 Add reltype', relType);
            } else if (relType) {
                const types = this.relshiptypes;
                for (let i = 0; i < types.length; i++) {
                    const type = types[i];
                    if (type.id === relType?.id) {
                        types[i] = relType;
                        break;
                    }
                }
            }
        }
    }
    addRelationshipType0(relType: cxRelationshipType) {
        // Check if input is of correct category and not already in list (TBD)
        if (relType?.category === constants.gojs.C_RELSHIPTYPE) {
            if (relType.name !== constants.types.AKM_RELSHIP_TYPE && relType.name !== constants.types.AKM__IS) {
                if (this.relshiptypes0 == null)
                    this.relshiptypes0 = new Array();
                if (!this.findRelationshipType0(relType.id))
                    this.relshiptypes0.push(relType);
            } else {
                const types = this.relshiptypes0;
                for (let i = 0; i < types.length; i++) {
                    const type = types[i];
                    if (type.id === reltype?.id) {
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
                for (let i = 0; i < len; i++) {
                    const rtview = this.relshiptypeviews[i];
                    if (debug) console.log('3687 rtview', rtview);
                    if (rtview.id === reltypeview.id) {
                        // Relship typeview is already in list, copy values
                        for (let prop in reltypeview) {
                            if (prop === 'id') continue;
                            if (prop === 'name') continue;
                            if (prop === 'data') continue;
                            if (prop === 'typeRef') continue;
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
            if (this.submetamodelRefs == null)
                this.submetamodelRefs = new Array();
            if (!this.findSubMetamodelRef(metamodel.id))
                this.submetamodelRefs.push(metamodel.id);
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
    findDatatype(id: string): cxDatatype | null {
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
    findObjectType0ByName(name: string): cxObjectType | null {
        const types = this.getObjectTypes0();
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
            }
            i++;
        }
        return null;
    }
    findObjtypeGeoByType(type: cxObjectType): cxObjtypeGeo | null {
        if (!type) return null;
        let geos = this.getObjtypeGeos();
        if (!geos) return null;
        for (let i = 0; i < geos.length; i++) {
            let geo = geos[i];
            if (!geo?.markedAsDeleted) {
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
            if (prop && prop.markedAsDeleted)
                continue;
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
            for (let i = 0; i < types.length; i++) {
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
            for (let i = 0; i < types.length; i++) {
                let reltype = types[i] as cxRelationshipType;
                if (reltype.isDeleted()) continue;
                if (reltype.getName() === name) {
                    if (reltype.isAllowedFromType(fromObjType, true)) {
                        if (debug) console.log('3737 reltype', reltype, fromObjType, toObjType);
                        if (reltype.isAllowedToType(toObjType, true)) {
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
    findRelationshipTypesBetweenTypes(fromType: cxObjectType, toType: cxObjectType, includeGen: boolean): cxRelationshipType[] | null {
        if (!fromType || !toType)
            return null;
        const rtypes = this.getRelshipTypes();
        if (!rtypes) return null;
        const reltypes = new Array();
        let i = 0;
        let reltype = null;
        for (i = 0; i < rtypes.length; i++) {
            reltype = rtypes[i];
            if (reltype.isDeleted())
                continue;
            if (reltype.name === constants.types.AKM_IS)
                continue;
            if (reltype.name === constants.types.AKM_REFERS_TO) {
                reltypes.push(reltype);
                continue;
            }
            const fromObjType = reltype.getFromObjType();
            const toObjType = reltype.getToObjType();
            if (fromObjType && toObjType) {
                if (reltype.name === constants.types.AKM_RELATIONSHIP_TYPE) {
                    if (fromType.name === constants.types.AKM_ENTITY_TYPE &&
                        toType.name === constants.types.AKM_ENTITY_TYPE) {
                        reltypes.push(reltype);
                    } else
                        continue;
                }
                if (fromType.inherits(fromObjType) && toType.inherits(toObjType)) {
                    if (fromObjType.name === constants.types.AKM_ENTITY_TYPE ||
                        fromObjType.name === constants.types.AKM_GENERIC) {
                        if (includeGen)
                            reltypes.push(reltype);
                    } else if (fromObjType.name === constants.types.AKM_ENTITY_TYPE) {
                        reltypes.push(reltype);
                    }
                } else if (includeGen) {
                    if (fromObjType.name === constants.types.AKM_ENTITY_TYPE &&
                        toObjType.name === constants.types.AKM_ENTITY_TYPE) {
                        reltypes.push(reltype);
                    }
                }
            }
            if (reltype.relshipkind === constants.relkinds.GEN)
                continue;
            if (reltype.isAllowedFromType(fromType, includeGen)) {
                if (reltype.isAllowedToType(toType, includeGen)) {
                    reltypes.push(reltype);
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
            }
        }
        return null;
    }
    findMetamodel(id: string): cxMetaModel | null {
        let metamodels = this.metamodels;
        if (!metamodels) return null;
        let i = 0;
        let mm = null;
        for (i = 0; i < metamodels.length; i++) {
            mm = metamodels[i];
            if (mm.isDeleted()) continue;
            if (mm.id === id)
                return mm;
        }
        return null;
    }
    findContainedMetamodel(id: string): cxMetaModel | null {
        let metamodels = this.metamodels;
        if (!metamodels) return null;
        let i = 0;
        let mm = null;
        for (i = 0; i < metamodels.length; i++) {
            mm = metamodels[i];
            if (mm.isDeleted()) continue;
            if (mm.id === id)
                return mm;
        }
        return null;
    }
    findSubMetamodelRef(id: string): cxMetaModel | null {
        let submetamodelRefs = this.submetamodelRefs;
        if (!submetamodelRefs) return null;
        let i = 0;
        let submetaRef = null;
        for (i = 0; i < submetamodelRefs.length; i++) {
            submetaRef = submetamodelRefs[i];
            if (submetaRef === id)
                return submetaRef;
        }
        return null;
    }
    findSubModel(id: string): cxModel | null {
        let submodels = this.submodels;
        if (!submodels) return null;
        let i = 0;
        let submodel = null;
        for (i = 0; i < submodels.length; i++) {
            submodel = submodels[i];
            if (submodel.isDeleted()) continue;
            if (submodel.id === id)
                return submodel;
        }
        return null;
    }
    findSubModelByName(name: string): cxModel | null {
        let submodels = this.submodels;
        if (!submodels) return null;
        let i = 0;
        let submodel = null;
        for (i = 0; i < submodels.length; i++) {
            submodel = submodels[i];
            if (submodel.isDeleted()) continue;
            if (submodel.name === name)
                return submodel;
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
    purgeObjtypeGeos(): cxObjtypeGeo[] | null {
        const newobjtypeGeos = [];
        const objtypeGeos = this.objtypegeos;
        if (!objtypeGeos) return;
        for (let i = 0; i < objtypeGeos.length; i++) {
            const objtypeGeo = objtypeGeos[i];
            if (objtypeGeo.isDeleted()) continue;
            if (newobjtypeGeos?.length === 0) {
                newobjtypeGeos.push(objtypeGeo);
                continue;
            }
            let found = false;
            for (let j = 0; j < newobjtypeGeos?.length; j++) {
                const objtypeGeo2 = newobjtypeGeos[j];
                if (objtypeGeo2?.type?.id === objtypeGeo?.type?.id) {
                    found = true;
                    continue;
                }
            }
            if (!found) newobjtypeGeos.push(objtypeGeo);
        }
        if (debug) console.log("purgeObjtypeGeos: " + newobjtypeGeos);
        return newobjtypeGeos;
    }
    embedContainedMetamodels() {
        let metamodels = this.metamodels;
        if (!metamodels) return;
        for (let i = 0; i < metamodels.length; i++) {
            const id = "id";
            let mm = metamodels[i];
            if (mm.isDeleted()) continue;
            this.objecttypes = this.objecttypes.concat(mm.objecttypes);
            utils.removeArrayDuplicatesById(this.objecttypes, id);
            this.objecttypes0 = this.objecttypes0.concat(mm.objecttypes0);
            utils.removeArrayDuplicatesById(this.objecttypes0, id);
            this.relshiptypes = this.relshiptypes.concat(mm.relshiptypes);
            utils.removeArrayDuplicatesById(this.relshiptypes, id);
            this.relshiptypes0 = this.relshiptypes0.concat(mm.relshiptypes0);
            utils.removeArrayDuplicatesById(this.relshiptypes0, id);
            this.objecttypeviews = this.objecttypeviews.concat(mm.objecttypeviews);
            utils.removeArrayDuplicatesById(this.objecttypeviews, id);
            this.relshiptypeviews = this.relshiptypeviews.concat(mm.relshiptypeviews);
            utils.removeArrayDuplicatesById(this.relshiptypeviews, id);
        }
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
    supertypes: cxObjectType[] | null;
    supertypeRefs: string[] | null;
    properties: cxProperty[] | null;
    propertyRefs: string[] | null;
    attributes: cxAttribute[] | null;
    methods: cxMethod[] | null;
    methodRefs: string[] | null;
    queries: any;
    typeview: cxObjectTypeView | cxRelationshipTypeView | null;
    typeviewRef: string | null;
    viewkind: string;
    relshipkind: string;
    defaultValueset: any;
    // Constructor
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.abstract = false;
        this.supertypes = [];
        this.supertypeRefs = [];
        this.properties = [];
        this.propertyRefs = [];
        this.attributes = [];
        this.typeview = null; // Default typeview
        this.typeviewRef = ""; // Default typeview
        this.viewkind = "";
        this.relshipkind = "";
        this.defaultValueset = null;    // Meant to store default property values
        this.methods = [];
        this.methodRefs = [];
        this.queries = [];
    }
    // Methods
    addSupertype(type: cxObjectType) {
        // Check if input is of correct category and not already in list (TBD)
        if (type.category === constants.gojs.C_OBJECTTYPE ||
            type.category === constants.gojs.C_RELSHIPTYPE) {
            if (!this.supertypes)
                this.supertypes = new Array();
            for (let i = 0; i < this.supertypes.length; i++) {
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
            const len = this.properties?.length;
            if (!len) {
                this.properties.push(prop);
            } else {
                let found = false;
                for (let i = 0; i < len; i++) {
                    const p = this.properties[i];
                    if (!p) continue;
                    if (p.name === prop.name) {
                        this.properties[i] = prop;
                        found = true;
                    }
                }
                if (!found) {
                    this.properties.push(prop);
                }
            }
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
                for (let i = 0; i < len; i++) {
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
        for (let i = 0; i < attrs.length; i++) {
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
                if (properties[i]?.name === propname) {
                    const prop = properties[i] as cxProperty;
                    return prop;
                }
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
                for (let i = 0; i < noSupertypes; i++) {
                    const supertype = this.supertypes[i];
                    if (debug) console.log('3490 supertype', supertype);
                    if (supertype) {
                        let superprops = supertype.properties;
                        for (let j = 0; j < superprops?.length; j++) {
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
                for (let i = 0; i < noSupertypes; i++) {
                    const supertype = this.supertypes[i];
                    if (debug) console.log('3758 supertype', supertype);
                    if (supertype) {
                        let supermtds = supertype.methods;
                        for (let j = 0; j < supermtds?.length; j++) {
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
    getSupertypes(): cxObjectType[] | null {
        return this.supertypes;
    }
    getProperties(includeInherited: boolean): cxProperty[] {
        if (!includeInherited)
            return this.properties;
        const props = this.properties;
        if (includeInherited) {
            if (debug) console.log('3485 superprops', this.supertypes);
            if (this.supertypes) {
                const noSupertypes = this.supertypes.length;
                for (let i = 0; i < noSupertypes; i++) {
                    const supertype = this.supertypes[i];
                    if (debug) console.log('3490 supertype', supertype);
                    if (supertype) {
                        let superprops = supertype.properties;
                        for (let j = 0; j < superprops?.length; j++) {
                            const sprop = superprops[j];
                            if (sprop) {
                                let found = false;
                                for (let k = 0; k < props.length; k++) {
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
    getPointerProperties(includeInherited: boolean): cxProperty[] | null {
        let props = this.getProperties(includeInherited);
        if (!props)
            return props;
        let props2: cxProperty[] = [];
        for (let i = 0; i < props.length; i++) {
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
        for (let i = 0; i < props1?.length; i++) {
            const p1 = props1[i];
            for (let j = 0; j < props2.length; j++) {
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
        for (let i = 0; i < stypes?.length; i++) {
            const stype = stypes[i];
            if (stype?.name === typeName)
                return true;
        }
        return retval;
    }
}

export class cxObjectType extends cxType {
    typeid: string;
    ports: cxPort[] | null;
    fromObjtype: cxObjectType | null;
    toObjtype: cxObjectType | null;
    objtypegeos: cxObjtypeGeo[] | null;
    inputreltypes: cxRelationshipType[] | null;
    outputreltypes: cxRelationshipType[] | null;
    allObjecttypes: cxObjectType[] | null;
    allRelationshiptypes: cxRelationshipType[] | null;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.category = constants.gojs.C_OBJECTTYPE;
        this.typeid = constants.types.OBJECTTYPE_ID;
        this.viewkind = constants.viewkinds.OBJ;
        this.relshipkind = "";
        this.ports = null;
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
        for (let i = 0; i < len; i++) {
            const rtype = this.inputreltypes[i];
            if (rtype.id === reltype?.id) {
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
        for (let i = 0; i < len; i++) {
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
        for (let i = 0; i < len; i++) {
            const rtype = this.outputreltypes[i];
            if (rtype.id === reltype?.id) {
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
        for (let i = 0; i < len; i++) {
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
        for (let i = 0; i < len; i++) {
            const rtype = this.outputreltypes[i];
            if (kind) {
                if (rtype.relshipkind === kind) {
                    reltypes.push(rtype);
                }
            } else {
                reltypes.push(rtype);
            }
        }
        return reltypes;
    }
    addPort(port: cxPort) {
        let ports;
        if (!this.ports)
            this.ports = new Array();
        ports = this.ports;
        const len = ports.length;
        for (let i = 0; i < len; i++) {
            const p = ports[i];
            if (p.id === port.id) {
                // Port is already in list
                return;
            }
            ports.push(port);
        }
    }
    getPorts() {
        return this.ports;
    }
    getPort(portid: string): cxPort | null {
        let ports = this.ports;
        const len = ports.length;
        for (let i = 0; i < len; i++) {
            const p = ports[i];
            if (p.id === portid) {
                return p;
            }
        }
        return null;
    }
    getPortsBySide(side: string): cxPort[] | null {
        const ports = [];
        const len = this.ports.length;
        for (let i = 0; i < len; i++) {
            const p = this.ports[i];
            if (p.side === side) {
                ports.push(p);
            }
        }
        return ports;
    }
    getPortByNameAndSide(name: string, side: string): cxPort | null {
        let ports = this.getPortsBySide(side);
        if (!ports)
            return null;
        const len = ports.length;
        for (let i = 0; i < len; i++) {
            const p = ports[i];
            if (p.name === name) {
                return p;
            }
        }
        return null;
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
        let supertypes = new Array();
        try {
            if (!level) level = 0;
            const rtypes = this.outputreltypes;
            if (rtypes) {
                for (let i = 0; i < rtypes?.length; i++) {
                    const rtype = rtypes[i];
                    if (rtype?.relshipkind === constants.relkinds.GEN) {
                        const stype = rtype.toObjtype;
                        if (stype) {
                            supertypes.push(stype);
                            supertypes = [...new Set(supertypes)];
                            if (level > 5)
                                return supertypes;
                            const stypes = stype.findSupertypes(++level);
                            if (stypes) {
                                for (let j = 0; j < stypes.length; j++) {
                                    const stype = stypes[j];
                                    supertypes.push(stype);
                                    supertypes = [...new Set(supertypes)];
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.log('5680 error', error);
        }
        return supertypes;
    }
    inherits(type: cxObjectType, level: int): boolean {
        if (!level) level = 0;
        if (level > 5) return false;
        // Check if this (objecttype) inherits from type
        let retval = false;
        if (this.id === type.id) {
            return true;
        } else {
            const reltypes = this.getOutputReltypes(constants.relkinds.GEN);
            if (reltypes) {
                for (let i = 0; i < reltypes.length; i++) {
                    const reltype = reltypes[i];
                    const supertype = reltype?.toObjtype;
                    if (supertype) {
                        if (supertype.id === type.id) {
                            retval = true;
                            break;
                        } else {
                            level++;
                            retval = supertype.inherits(type, level);
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
                if (objtype.inherits(otype)) {
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
                            if (rtype1)
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
        for (let i = 0; i < metamodels.length; i++) {
            const mm = metamodels[i];
            const objtypes = mm.objecttypes;
            for (let j = 0; j < objtypes.length; j++) {
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
    getLoc(): string {
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
        if (debug) console.log('5422 New reltype', this);
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
    getCardinality(): string {
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
    isAllowedFromType(objtype: cxObjectType, includeGen: boolean): boolean {
        if (objtype && this.fromObjtype) {
            if (this.fromObjtype.id === objtype.id)
                return true;
            if (includeGen) {
                if (objtype.inherits(this.fromObjtype)) {
                    return true;
                }
            }
        }
        return false;
    }
    isAllowedToType(objtype: cxObjectType, includeGen: boolean): boolean {
        if (objtype && this.toObjtype) {
            if (this.toObjtype.id === objtype.id)
                return true;
            if (includeGen) {
                if (objtype.inherits(this.toObjtype)) {
                    return true;
                }
            }
        }
        return false;
    }
    isAllowedFromAndToTypes(fromType: cxObjectType, toType: cxObjectType): boolean {
        let retval = false;
        if (!fromType && !toType)
            return retval;
        if (this.toObjtype.name !== constants.types.AKM_ELEMENT &&
            this.toObjtype.name !== constants.types.AKM_ENTITY_TYPE) {
            if (fromType.inherits(this.toObjtype) &&
                toType.inherits(this.toObjtype)) {
                retval = true;
            }
        }
        return retval;
    }
    setFromObjectType(objtype: cxObjectType) {
        this.fromObjtype = objtype;
        this.fromobjtypeRef = objtype.id;
    }
    setToObjectType(objtype: cxObjectType) {
        this.toObjtype = objtype;
        this.toobjtypeRef = objtype.id;
    }

    findSupertypes(level: number): cxObjectType[] | null {
        let supertypes: cxObjectType[] = new Array();
        try {
            if (!level) level = 0;
            const rtypes = this.outputreltypes;
            if (rtypes) {
                for (let i = 0; i < rtypes?.length; i++) {
                    const rtype = rtypes[i];
                    if (rtype?.relshipkind === constants.relkinds.GEN) {
                        const stype = rtype.toObjtype;
                        if (stype) {
                            supertypes.push(stype);
                            supertypes = [...new Set(supertypes)];
                            if (level > 5)
                                return supertypes;
                            const stypes = stype.findSupertypes(++level);
                            if (stypes) {
                                for (let j = 0; j < stypes.length; j++) {
                                    const stype = stypes[j];
                                    supertypes.push(stype);
                                    supertypes = [...new Set(supertypes)];
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.log('5680 error', error);
        }
        return supertypes;
    }

    numberOfMetamodelsUsage(metis: cxMetis): number {
        let count = 0;
        const metamodels = metis.metamodels;
        for (let i = 0; i < metamodels.length; i++) {
            const mm = metamodels[i];
            const reltypes = mm.relshiptypes;
            for (let j = 0; j < reltypes.length; j++) {
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
    datatype: cxDatatype | null;
    datatypeRef: string;
    method: cxMethod | null;
    methodRef: string;
    unitCategory: cxUnitCategory | null;
    unitCategoryRef: string;
    subProperties: cxProperty[] | null;
    defaultValue: string;
    readOnly: boolean;
    inputPattern: string;
    viewFormat: string;
    example: string;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_PROPERTIES;  // Firestore collection
        this.category = constants.gojs.C_PROPERTY;
        this.datatype = null;
        this.datatypeRef = "";            // Neccessary ???
        this.method = null;
        this.methodRef = "";
        this.unitCategory = null;
        this.unitCategoryRef = "";
        this.subProperties = null;
        this.defaultValue = " ";
        this.readOnly = false;
        this.inputPattern = "";
        this.viewFormat = "";
        this.example = "";
    }
    // Methods
    setDatatype(datatype: cxDatatype) {
        this.datatype = datatype;
        this.datatypeRef = datatype.id;
    }
    getDatatype(): cxDatatype | null {
        if (this.datatype)
            return this.datatype;
        else // if (this.datatypeRef)
            return null;
    }
    getDatatypeRef(): string {
        return this.datatypeRef;
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
    getMethodRef(): string {
        return this.methodRef;
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
    addSubProperty(subprop: cxProperty) {
        if (this.subProperties == null)
            this.subProperties = new Array();
        this.subProperties.push(subprop);
    }
    getSubProperties(): cxProperty[] | null {
        return this.subProperties;
    }
    getSubProperty(name: string): cxProperty | null {
        if (this.subProperties) {
            for (let i = 0; i < this.subProperties.length; i++) {
                const subprop = this.subProperties[i];
                if (subprop.name === name)
                    return subprop;
            }
        }
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
    name: string;
    typeName: string;
    propName: string;
    propRef: string;     // Property id
    constructor(type: cxType, prop: cxProperty) {
        if (prop && type) {
            this.typeName = type.name;
            this.propName = prop.name;
            this.name = this.typeName + '.' + this.propName;
            this.propRef = prop.id;
        }
    }
}

export class cxMethod extends cxMetaObject {
    methodtype: string;
    expression: string;
    allProperties: cxProperty[] | null;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.category = constants.gojs.C_METHOD;
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
        if (expr.length > 0) {
            return eval(expr);
        }
    }
}

export class cxViewStyle extends cxMetaObject {
    objecttypeviews: cxObjectTypeView[] | null;
    relshiptypeviews: cxRelationshipTypeView[] | null = null;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.category = constants.gojs.C_VIEWSTYLE;
        this.objecttypeviews = null;
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
    // abstract: boolean;
    memberscale: string;
    arrowscale: string;
    viewkind: string;
    template: string;
    // figure: string;
    // geometry: string;
    icon: string;
    image: string;
    grabIsAllowed: boolean;
    fillcolor: string;
    fillcolor2: string;
    strokecolor: string;
    strokecolor2: string;
    strokewidth: string;
    textcolor: string;
    textcolor2: string;
    textscale: string;
    constructor() {
        // this.abstract = false;
        this.memberscale = "1";
        this.arrowscale = "1.3";
        this.viewkind = constants.viewkinds.OBJ;
        this.template = "textAndIcon";
        // this.figure = "";
        // this.geometry = "";
        this.icon = "";
        this.image = "";
        this.grabIsAllowed = false;
        this.fillcolor = "";
        this.fillcolor2 = "";
        this.strokecolor = "gray";
        this.strokecolor2 = "gray";
        this.strokewidth = "1";
        this.textcolor = "";
        this.textcolor2 = "";
        this.textscale = "1";
    }
}

export class cxObjectTypeView extends cxMetaObject {
    // type: cxObjectType | null;
    typeRef: string;
    data: cxObjtypeviewData;
    arrowscale: string;
    memberscale: string;
    viewkind: string;
    template: string;
    // figure: string;
    // geometry: string;
    icon: string;
    image: string;
    grabIsAllowed: boolean;
    fillcolor: string;
    fillcolor2: string;
    strokecolor: string;
    strokecolor2: string;
    strokewidth: string;
    textcolor: string;
    textcolor2: string;
    textscale: string;
    constructor(id: string, name: string, type: cxObjectType | null, description: string) {
        super(id, name, description);
        this.fs_collection = constants.fs.FS_C_OBJECTTYPEVIEWS;  // Firestore collection
        this.category = constants.gojs.C_OBJECTTYPEVIEW;
        // this.type        = type;
        this.typeRef = type?.id;
        this.template = "";
        // this.figure      = "";
        // this.geometry    = "";
        this.arrowscale = "1";
        this.memberscale = "1";
        this.fillcolor = "";
        this.fillcolor2 = "";
        this.strokecolor = "";
        this.strokecolor2 = "";
        this.strokewidth = "1";
        this.textcolor = "";
        this.textcolor2 = "";
        this.textscale = "1";
        this.viewkind = constants.viewkinds.OBJ;
        this.grabIsAllowed = false;
        this.icon = 'images/types/' + type?.name;
        this.image = "";
        this.data = new cxObjtypeviewData();
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
                data[prop] = objview[prop];
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
        if (this.data.viewkind)
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
    setGrabIsAllowed(flag: boolean) {
        this.grabIsAllowed = flag;
    }
    getGrabIsAllowed(): boolean {
        return this.grabIsAllowed;
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
    // setFigure(figure: string) {
    //     this.data.figure = figure;
    //     this.figure = figure;
    // }
    // getFigure(): string {
    //     if (this.figure)
    //         return this.figure;
    //     else if (this.data.figure)
    //         return this.data.figure;
    //     return "";
    // }
    // setGeometry(geometry: string) {
    //     this.data.geometry = geometry;
    //     this.geometry = geometry;
    // }
    // getGeometry(): string {
    //     if (this.geometry)
    //         return this.geometry;
    //     else if (this.data.geometry)
    //         return this.data.geometry;
    //     return "";
    // }
    setFillcolor(fillcolor: string) {
        this.data.fillcolor = fillcolor;
        this.fillcolor = fillcolor;
    }
    getFillcolor(): string {
        if (this.fillcolor)
            return this.fillcolor;
        else if (this.data.fillcolor)
            return this.data.fillcolor;
        return "white";
    }
    setFillcolor2(fillcolor: string) {
        this.data.fillcolor2 = fillcolor;
        this.fillcolor2 = fillcolor;
    }
    getFillcolor2(): string {
        if (this.fillcolor2)
            return this.fillcolor2;
        else if (this.data.fillcolor2)
            return this.data.fillcolor2;
        return "white";
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
        return "black";
    }
    setTextcolor2(color: string) {
        this.data.textcolor2 = color;
        this.textcolor2 = color;
    }
    getTextcolor2(): string {
        if (this.textcolor2)
            return this.textcolor2;
        else if (this.data.textcolor2)
            return this.data.textcolor2;
        return "black";
    }
    setTextscale(scale: string) {
        if (scale == undefined || scale == "" || scale == null)
            scale = "1";
        this.data.textscale = scale;
        this.textscale = scale;
    }
    getTextscale(): string {
        if (this.textscale)
            return this.textscale;
        else if (this.data.textscale)
            return this.data.textscale;
        return "1";
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
        return "black";
    }
    setStrokecolor2(strokecolor: string) {
        this.data.strokecolor2 = strokecolor;
        this.strokecolor2 = strokecolor;
    }
    getStrokecolor2(): string {
        if (this.strokecolor2)
            return this.strokecolor2;
        else if (this.data.strokecolor2)
            return this.data.strokecolor2;
        return "black";
    }
    setStrokewidth(strokewidth: string) {
        this.strokewidth = strokewidth;
        this.data.strokewidth = strokewidth;
    }
    getStrokewidth(): string {
        if (this.strokewidth)
            return this.strokewidth;
        else if (this.data.strokewidth)
            return this.data.strokewidth;
        return "2";
    }
    setMemberscale(memberscale: string) {
        this.memberscale = memberscale;
        this.data.memberscale = memberscale;
    }
    getMemberscale(): string {
        if (this.memberscale)
            return this.memberscale;
        else if (this.data.memberscale)
            return this.data.memberscale;
        return "1"; // Default  1
    }
    setArrowscale(arrowscale: string) {
        this.arrowscale = arrowscale;
        this.data.arrowscale = arrowscale;
    }
    getArrowscale(): string {
        if (this.arrowscale)
            return this.arrowscale;
        else if (this.data.arrowscale)
            return this.data.arrowscale;
        return "1.3"; // Default  1
    }
    setIcon(icon: string) {
        this.data.icon = icon;
        this.icon = icon;
    }
    getIcon(): string {
        if (this.icon)
            return this.icon;
        else if (this.data.icon)
            return this.data.icon;
        return "";
    }
    setIcon(icon: string) {
        this.data.icon = icon;
        this.icon = icon;
    }
    getIcon(): string {
        if (this.icon)
            return this.icon;
        else if (this.data.icon)
            return this.data.icon;
        return "";
    }
    setImage(image: string) {
        this.data.image = image;
        this.image = image;
    }
    getImage(): string {
        if (this.image)
            return this.image;
        else if (this.data.image)
            return this.data.image;
        return "";
    }
}

export class cxReltypeviewData {
    abstract: boolean;
    class: string;
    relshipkind: string;
    template: string;
    strokecolor: string;
    strokewidth: string;
    textcolor: string;
    arrowscale: string;
    textscale: string;
    dash: string;
    fromArrow: string;
    toArrow: string;
    fromArrowColor: string;
    toArrowColor: string;
    routing: string;
    corner: string;
    curve: string;
    constructor() {
        this.abstract = false;
        this.relshipkind = constants.relkinds.REL;
        this.template = "linkTemplate1";
        this.strokecolor = "black";
        this.strokewidth = "1";
        this.textcolor = "black";
        this.arrowscale = "1.3";
        this.textscale = "1";
        this.dash = "None";
        this.fromArrow = "";
        this.toArrow = "OpenTriangle";
        this.fromArrowColor = "";
        this.toArrowColor = "white";
        this.routing = "Normal";
        this.corner = "0";
        this.curve = "0";
    }
}

export class cxRelationshipTypeView extends cxMetaObject {
    // type:           cxRelationshipType | null;
    typeRef: string;
    data: cxReltypeviewData;
    template: string;
    strokecolor: string;
    strokewidth: string;
    textcolor: string;
    dash: string;
    textscale: string;
    arrowscale: string;
    fromArrow: string;
    toArrow: string;
    fromArrowColor: string;
    toArrowColor: string;
    routing: string;
    corner: string;
    curve: string;
    constructor(id: string, name: string, type: cxRelationshipType | null, description: string) {
        if (name === "" || name === id) {
            name = type?.name + '_' + type?.relshipkind;
        }
        super(id, name, description);
        this.category = constants.gojs.C_RELSHIPTYPEVIEW;
        // this.type     = type;
        this.typeRef = type?.id;
        this.data = new cxReltypeviewData();
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
                if (prop === 'template') data[prop] = relview[prop];
                if (prop === 'strokecolor') data[prop] = relview[prop];
                if (prop === 'strokewidth') data[prop] = relview[prop];
                if (prop === 'textcolor') data[prop] = relview[prop];
                if (prop === 'textscale') data[prop] = relview[prop];
                if (prop === 'dash') data[prop] = relview[prop];
                if (prop === 'fromArrow') data[prop] = relview[prop];
                if (prop === 'toArrow') data[prop] = relview[prop];
                if (prop === 'fromArrowColor') data[prop] = relview[prop];
                if (prop === 'toArrowColor') data[prop] = relview[prop];
                if (prop === 'routing') data[prop] = relview[prop];
                if (prop === 'corner') data[prop] = relview[prop];
                if (prop === 'curve') data[prop] = relview[prop];
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
        if (scale == undefined || scale == "" || scale == null)
            scale = "1";
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
    setArrowscale(scale: string) {
        if (scale == undefined || scale == "" || scale == null)
            scale = "1";
        this.data.arrowscale = scale;
        this.arrowscale = scale;
    }
    getArrowscale(): string {
        if (this.arrowscale)
            return this.arrowscale;
        else if (this.data.arrowscale)
            return this.data.arrowscale;
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
    setRouting(routing: string) {
        this.data.routing = routing;
        this.routing = routing;
    }
    getRouting(): string {
        if (this.routing)
            return this.routing;
        else if (this.data.routing)
            return this.data.routing;
        else
            return "";
    }
    setCurve(curve: string) {
        this.data.curve = curve;
        this.curve = curve;
    }
    getCurve(): string {
        if (this.curve)
            return this.curve;
        else if (this.data.curve)
            return this.data.curve;
        else
            return "";
    }
    setCorner(corner: string) {
        this.data.corner = corner;
        this.corner = corner;
    }
    getCorner(): string {
        if (this.corner)
            return this.corner;
        else if (this.data.corner)
            return this.data.corner;
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
                this.setFromArrow('');
                this.setFromArrowColor('');
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
    objectRefs: string[] | null;
    relshipRefs: string[] | null;
    ports: cxPort[] | null;
    portRefs: string[] | null;
    modelviews: cxModelView[] | null;
    modelviewRefs: string[] | null;
    selectedNodes: any[];
    selectedLinks: any[];
    constructor(id: string, name: string, metamodel: cxMetaModel | null, description: string) {
        super(id, name, description);
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
        this.includeRelshipkind = true;
        this.layer = 'Foreground';
        this.submodels = null;
        this.objects = null;
        this.relships = null;
        this.ports = null;
        this.modelviews = null;
        this.objectRefs = null;
        this.relshipRefs = null;
        this.portRefs = null;
        this.modelviewRefs = null;
        this.selectedNodes = [];
        this.selectedLinks = [];
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
        for (let i = 0; i < this.objects.length; i++) {
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
                    if (type && type.getId() === reltype?.getId())
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
        if (obj?.category === constants.gojs.C_OBJECT) {
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
    addObjectRef(obj: cxObject) {
        if (obj.category === constants.gojs.C_OBJECT) {
            if (this.objectRefs == null)
                this.objectRefs = new Array();
            if (!this.findObject(obj.id))
                this.objectRefs.push(obj.id);
            else {
                const objectRefs = this.objectRefs;
                let found = false;
                for (let i = 0; i < objectRefs.length; i++) {
                    const objref = objectRefs[i];
                    if (objref === obj.id) {
                        found = true;
                        break;
                    }
                }
                if (!found)
                    objectRefs.push(obj.id);
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
    addRelshipRef(rel: cxRelationship) {
        if (rel.category === constants.gojs.C_RELATIONSHIP) {
            if (this.relshipRefs == null)
                this.relshipRefs = new Array();
            if (!this.findRelationship(rel.id))
                this.relshipRefs.push(rel.id);
            else {
                const relshipRefs = this.relshipRefs;
                let found = false;
                for (let i = 0; i < relshipRefs.length; i++) {
                    const relshipRef = relshipRefs[i];
                    if (relshipRef === rel.id) {
                        found = true;
                        break;
                    }
                }
                if (!found)
                    relshipRefs.push(rel.id);
            }
        }
    }
    addPort(obj: cxPort) {
        if (obj.category === constants.gojs.C_PORT) {
            if (this.ports == null)
                this.ports = new Array();
            if (!this.findPort(obj.id))
                this.ports.push(obj);
            else {
                const ports = this.ports;
                for (let i = 0; i < ports.length; i++) {
                    const port = ports[i];
                    if (port.id === obj.id) {
                        ports[i] = obj;
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
        if (!objtype)
            return null;
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
                }
                i++;
            }
        }
        return null;
    }
    findRelationship1(fromObj: cxObject, toObj: cxObject, reltype: cxRelationshipType, fromPort: cxPort, toPort: cxPort): cxRelationship | null {
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
                            if (rtype.id === reltype?.id) {
                                if (relFromObj.id === fromObj.id) {
                                    if (relToObj.id === toObj.id) {
                                        if (!fromPort && !toPort)
                                            return rel;
                                        else if (rel.fromPortid === fromPort.id && rel.toPortid === toPort.id)
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
    findRelationship2(fromObj: cxObject, toObj: cxObject, relname: string, reltype: cxRelationshipType, fromPort: cxPort, toPort: cxPort): cxRelationship | null {
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
                            if (rtype.id === reltype?.id) {
                                if (relFromObj.id === fromObj?.id) {
                                    if (relToObj.id === toObj?.id) {
                                        if (!fromPort && !toPort)
                                            return rel;
                                        else if (rel.fromPortid === fromPort.id && rel.toPortid === toPort.id)
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
                        if (rtype.id === reltype?.id) {
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
                if (rtype && rtype.id === reltype?.id) {
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
    typeDescription: string;
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
        this.typeDescription = type?.description;
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
        let type = metis.findObjectType(this.type.id);
        if (!type) {
            type = metis.findRelationshipType(this.type.id);
        }
        if (!type) {
            return null;
        }
        const typeprops = type.getProperties(true);
        let mtdprops = null;
        if (debug) console.log('7133 this', this);
        if (type.name === 'Method') {
            const mtdtype = this["methodtype"];
            if (mtdtype) {
                const metamodel = metis.currentMetamodel;
                const mtype = metamodel.findMethodTypeByName(mtdtype);
                if (mtype) {
                    mtdprops = mtype.properties;
                    if (debug) console.log('7141 mtype, mtdprops', mtype, mtdprops);
                }
            }
        }
        let properties = typeprops?.concat(mtdprops);
        properties = properties?.filter(function (p) {
            return p != null;
        });
        this.allProperties = properties;
        if (debug) console.log('7150 properties', properties);
        return properties;
    }
    addInputrel(relship: cxRelationship) {
        if (!this.inputrels)
            this.inputrels = new Array();
        const len = this.inputrels.length;
        for (let i = 0; i < len; i++) {
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
        for (let i = 0; i < len; i++) {
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
        for (let i = 0; i < len; i++) {
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
        for (let i = 0; i < len; i++) {
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
        return this.type as cxObjectType | cxRelationshipType;
    }
    getInheritedTypes(): cxObjectType[] | cxRelationshipType[] | null {
        let typelist: cxType[] = [];
        const type = this.getType() as cxType;
        if (!type) return null;
        if (type.supertypes.length > 0)
            return type.supertypes;
        // Else get the supertypes by following the supertype chain
        let types: cxType[] = [];
        try {
            types = type?.findSupertypes(0);
        } catch (error) {
            types = [];
        }
        for (let i = 0; i < types?.length; i++) {
            const tname = types[i]?.name;
            if (tname !== constants.types.AKM_ELEMENT)
                typelist.push(types[i]);
        }
        const uniqueSet = new Set(typelist); 
        typelist = [...uniqueSet];    
        return typelist;
    }
    getInheritedTypeNames(): string[] {
        const namelist = [];
        const type = this.getType();
        const types = type?.findSupertypes(0);
        for (let i = 0; i < types?.length; i++) {
            const tname = types[i]?.name;
            if (tname !== constants.types.AKM_ELEMENT)
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
    getInheritanceObjects(model: cxModel): cxObject[] | null {
        const objlist = [];
        const relships = this.getOutputRelships(model, constants.relkinds.GEN);
        if (relships?.length) {
            for (let i = 0; i < relships?.length; i++) {
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
    getInheritedObjectTypes(model: cxModel): cxObjectType[] | null {
        const typelist: cxObjectType[] = [];
        const metamodel = model.metamodel;
        // Handle Is relationships from the object
        const relships = this.getOutputRelships(model, constants.relkinds.GEN);
        for (let i = 0; i < relships?.length; i++) {
            const rel = relships[i];
            if (rel) {
                const toObj = rel.toObject;
                if (toObj && toObj.type) {
                    // if (toObj.type.properties.length > 0)
                    let type = toObj.type;
                    type = metamodel?.findObjectType(type.id);
                    typelist.push(type);
                }
            }
        }
        // Then handle the type itself
        let type = this.type;
        type = metamodel?.findObjectType(type?.id);
        try {
            const supertypes = type?.getSupertypes();
            for (let i = 0; i < supertypes?.length; i++) {
                let stype = supertypes[i];
                stype = metamodel?.findObjectType(stype?.id);
                if (stype) typelist.push(stype);
            }
        } catch (error) {
            if (debug) console.log('6470 error', error);
        }
        if (debug) console.log('6472 typelist', typelist);
        return typelist;
    }
    hasInheritedProperties(model: cxModel): boolean {
        let retval = false;
        const metamodel = model.metamodel;
        let types: cxObjectType[] | cxRelationshipType[] = this.getInheritedTypes();
        if (types?.length > 0) {
            for (let i = 0; i < types.length; i++) {
                let type = types[i];
                type = metamodel?.findObjectType(type?.id);
                if (type?.hasProperties())
                    return true;
            }
        }
        types = this.getInheritedObjectTypes(model);
        if (types?.length > 0) {
            for (let i = 0; i < types?.length; i++) {
                let type = types[i];
                type = metamodel?.findObjectType(type.id);
                if (type?.hasProperties())
                    return true;
            }
        }
        let objects = this.getInheritanceObjects(model);
        if (debug) console.log('6496 this, objects', this, objects);
        if (types?.length > 0) {
            for (let i = 0; i < objects?.length; i++) {
                const obj = objects[i];
                let type = obj?.type;
                type = metamodel?.findObjectType(type?.id);
                if (type?.hasProperties())
                    return true;
            }
        }
        return retval;
    }
    getInheritedProperties(model: cxModel): cxProperty[] {
        const properties = new Array();
        const metamodel = model.metamodel;
        let objects = this.getInheritanceObjects(model);
        if (debug) console.log('7159 inheritanceObjects', objects);
        for (let i = 0; i < objects?.length; i++) {
            const obj = objects[i];
            let type = obj?.type;
            type = metamodel?.findObjectType(type?.id);
            if (type?.hasProperties()) {
                const props = type.properties;
                for (let j = 0; j < props.length; j++) {
                    const prop = props[j];
                    properties.push(prop);
                }
            }
        }
        if (debug) console.log('7171 inherited Properties', properties);
        return properties;
    }
    getConnectedProperties(metis: cxMetis): cxProperty[] {
        const properties = new Array();
        const objects = this.getConnectedObjects2(metis);
        for (let i = 0; i < objects?.length; i++) {
            const obj = objects[i];
            const prop = new cxProperty(utils.createGuid(), obj.type.name, "");
            properties.push(prop);
        }
        return properties;
    }
    isOfType(typeName: string): boolean {
        let retval = false;
        if (this.type?.name === typeName) {
            return true;
        }
        const stypes = this.type?.supertypes;
        for (let i = 0; i < stypes?.length; i++) {
            const stype = stypes[i];
            if (stype?.name === typeName)
                return true;
        }
        return retval;
    }
    isOfSystemType(systemtypeName: string): boolean {
        let retval = false;
        const type = this.type;
        if ((this.name === type?.name) || (type?.name === systemtypeName)) {
            return true;
        }
        const stypes = type?.supertypes;
        for (let i = 0; i < stypes?.length; i++) {
            const stype = stypes[i];
            if (stype?.name === systemtypeName)
                return true;
        }
        return retval;
    }
    addPort(side: string, name: string): cxPort {
        const port = new cxPort(utils.createGuid(), name, "", side);
        port.color = constants.gojs.C_PORT_COLOR;
        this.ports.push(port);
        return port;
    }
    deletePort(side: string, name: string) {
        this.ports = this.ports.filter(p => p.name !== name && p.side !== side);
    }
    deleteSidePorts(side: string) {
        this.ports = this.ports.filter(p => p.side !== side);
    }
    getPort(side: string, name: string): cxPort {
        let port = null;
        for (let i = 0; i < this.ports?.length; i++) {
            const p = this.ports[i];
            if ((p.side === side) && (p.name === name)) {
                port = p;
                break;
            }
        }
        return port;
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
            try {
                retval = reltype.getRelshipKind();
                this.relshipkind = retval;
            } catch (error) {
                retval = "";
            }
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
        let lng = props.length;
        for (let i=0; i<lng; i++) {
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
        if (debug) console.log('7377 prop, method', prop, method);
        if (method) {
            const mtdtype = method.methodtype;
            let context;
            switch (mtdtype) {
                case constants.types.MTD_AGGREGATEVALUE: {
                    context = {
                        "myMetis": metis,
                        "reltypes": method["reltypes"],
                        "reldir": method["reldir"],
                        "objtypes": method["objtypes"],
                        "prop": prop,
                    }
                    value = ui_mtd.aggregateValue(inst, context);
                    if (debug) console.log('7397 inst, context, value', inst, context, value);
                }
                    break;
                case constants.types.MTD_GETCONNECTEDOBJECT: {
                    if (debug) console.log('7401 method', method);
                    const rtypename = method["reltype"];
                    const reldir = method["reldir"];
                    let reltype = null;
                    if (rtypename !== 'any' && rtypename !== 'null')
                        reltype = metis.findRelationshipTypeByName(rtypename);
                    if (debug) console.log('7407 rtypename, reltype', rtypename, reltype);
                    const otypename = method["objtype"];
                    let objtype = null;
                    if (otypename !== 'any' && otypename !== 'null')
                        objtype = metis.findObjectTypeByName(otypename);
                    if (debug) console.log('7412 otypename, objtype', otypename, objtype);
                    context = {
                        "myMetis": metis,
                        "reltype": reltype,
                        "reldir": reldir,
                        "objtype": objtype,
                        "prop": prop,
                    }
                    if (debug) console.log('7420 inst, context', inst, context);
                    const obj = ui_mtd.getConnectedObject(inst, context);
                    if (debug) console.log('7422 inst, context, obj', inst, context, obj);
                    value = obj?.name;
                }
                    break;
                case constants.types.MTD_CALCULATEVALUE:
                default: {
                    if (debug) console.log('7428 method', method);
                    context = {
                        "myMetis": metis,
                        "prop": prop,
                    }
                    value = ui_mtd.calculateValue(inst, context);
                    inst[propname] = value;
                    if (debug) console.log('7435 inst, context, value', inst, context, value);
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
    getInputRelships(model: cxModel, rkind: string): cxRelationship[] | null {
        const rels = model.relships;
        if (!rels) return null;
        const relships: cxRelationship[] = new Array();
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
    getOutputRelships(model: cxModel, rkind: string): cxRelationship[] | null {
        const rels = model.relships;
        if (!rels) return null;
        const relships: cxRelationship[] = new Array();
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
    getInputRelshipsByType(reltype: cxRelationshipType): cxRelationship[] | null {
        const relships: cxRelationship[] = new Array();
        if (this.inputrels) {
            for (let i = 0; i < this.inputrels.length; i++) {
                let rel = this.inputrels[i];
                if (rel && !rel.markedAsDeleted) {
                    let type = rel.type;
                    if (type && type.id === reltype?.id) //sf added ?
                        relships.push(rel);
                }
            }
        }
        return relships;

    }
    getOutputRelshipsByType(reltype: cxRelationshipType): cxRelationship[] | null {
        const relships: cxRelationship[] = new Array();
        if (this.outputrels) {
            for (let i = 0; i < this.outputrels.length; i++) {
                let rel = this.outputrels[i];
                if (rel && !rel.markedAsDeleted) {
                    let type = rel.type;
                    if (type && type.id === reltype?.id)
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
        for (let i = 0; i < allProps.length; i++) {
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
    ports: cxPort[] | null;
    objectviews: cxObjectView[] | null;
    constructor(id: string, name: string, type: cxObjectType | null, description: string) {
        super(id, name, type, description);
        this.category = constants.gojs.C_OBJECT;
        this.ports = [];
        this.objectviews = null;
        // Handle properties
        const props = this.type?.properties;
        for (let i = 0; i < props?.length; i++) {
            const prop = props[i];
            if (prop.name === 'id') continue;
            if (prop) this[prop.name] = "";
        }
        if (debug) console.log('4600 obj', this);
        // Handle ports
        const ports = this.type?.ports;
        if (ports) {
            this.ports = new Array();
            for (let i = 0; i < ports.length; i++) {
                const port = ports[i];
                if (port) {
                    const portInst = new cxPort(utils.createGuid(), port.name, port.description, port.side);
                    portInst.color = port.color;
                    this.ports.push(portInst);
                }
            }
        }
    }
    // Methods
    addObjectView(objview: cxObjectView) {
        if (!this.objectviews)
            this.objectviews = new Array();
        const len = this.objectviews.length;
        if (debug) console.log('4881 objview', objview.markedAsDeleted, objview, this.objectviews);
        for (let i = 0; i < len; i++) {
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
        for (let i = 0; i < len; i++) {
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
    getConnectedObject(prop: cxProperty, metis: cxMetis): cxObject {
        let obj = null;
        const inst: any = this;
        const mtdRef = prop.methodRef;
        const method = metis.findMethod(mtdRef);
        const propname = prop.name;
        if (debug) console.log('7083 prop, method', prop, method);
        if (method) {
            const mtdtype = method.methodtype;
            if (mtdtype === constants.types.MTD_GETCONNECTEDOBJECT) {
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
                    "myMetis": metis,
                    "reltype": reltype,
                    "reldir": reldir,
                    "objtype": objtype,
                    "prop": prop,
                }
                obj = ui_mtd.getConnectedObject(this, context);
                if (debug) console.log('7107 inst, context, obj', inst, context, obj);
            }
        }
        return obj;
    }
    getConnectedObjects(metis: cxMetis): cxObject[] {
        const type = this.type;
        const properties = type?.properties;
        const objlist = [];
        for (let i = 0; i < properties?.length; i++) {
            const prop = properties[i];
            if (prop) {
                const obj = this.getConnectedObject(prop, metis);
                if (obj)
                    objlist.push(obj);
            }
        }
        return objlist;
    }
    getConnectedObjects1(prop: cxProperty, metis: cxMetis): cxObject[] {
        let objects = null;
        if (!prop) return objects;
        const inst: any = this;
        const mtdRef = prop.methodRef;
        const method = metis.findMethod(mtdRef);
        const propname = prop.name;
        if (debug) console.log('7307 prop, method', prop, method);
        if (method) {
            const mtdtype = method.methodtype;
            if (mtdtype === constants.types.MTD_GETCONNECTEDOBJECT) {
                let context;
                if (debug) console.log('7312 method', method);
                const rtypename: string = method["reltype"];
                const reldir: string = method["reldir"];
                const otypename: string = method["objtype"];
                let objtype: cxObjectType = null;
                if (otypename !== 'any' && otypename !== 'null')
                    objtype = metis.findObjectTypeByName(otypename);
                if (debug) console.log('7319 otypename, objtype', otypename, objtype);
                let reltype = null;
                if (rtypename !== 'any' && rtypename !== 'null')
                    reltype = metis.findRelationshipTypeByName2(rtypename, this.type, objtype);
                if (debug) console.log('7323 rtypename, reltype', rtypename, reltype);
                context = {
                    "myMetis": metis,
                    "reltype": reltype,
                    "reldir": reldir,
                    "objtype": objtype,
                    "prop": prop,
                }
                objects = ui_mtd.getConnectedObjects(this, context);
                if (debug) console.log('7332 inst, context, objects', inst, context, objects);
            }
        }
        return objects;
    }
    getConnectedObjects2(metis: cxMetis): cxObject[] {
        const type = this.type;
        const properties = type?.properties;
        const objlist: cxObject[] = [];
        for (let i = 0; i < properties?.length; i++) {
            const prop = properties[i];
            if (prop) {
                const objects = this.getConnectedObjects1(prop, metis);
                for (let i = 0; i < objects?.length; i++) {
                    objlist.push(objects[i]);
                }
            }
        }
        return objlist;
    }
    getConnectedObjectRoles(metis: cxMetis) {
        const type = this.type;
        const properties = type?.properties;
        const rolelist = [];
        for (let i = 0; i < properties?.length; i++) {
            const prop = properties[i];
            if (prop) {
                const objects = this.getConnectedObjects1(prop, metis);
                for (let i = 0; i < objects?.length; i++) {
                    rolelist.push(prop.name);
                }
            }
        }
        return rolelist;
    }
    getPorts(): cxPort[] {
        return this.ports;
    }
    getLeftPorts(): cxPort[] {
        const ports = [];
        for (let i = 0; i < this.ports?.length; i++) {
            const port = this.ports[i];
            if (port.side === constants.gojs.C_LEFT)
                ports.push(port);
        }
        return ports;
    }
    getRightPorts(): cxPort[] {
        const ports = [];
        for (let i = 0; i < this.ports?.length; i++) {
            const port = this.ports[i];
            if (port.side === constants.gojs.C_RIGHT)
                ports.push(port);
        }
        return ports;
    }
    getTopPorts(): cxPort[] {
        const ports = [];
        for (let i = 0; i < this.ports?.length; i++) {
            const port = this.ports[i];
            if (port.side === constants.gojs.C_TOP)
                ports.push(port);
        }
        return ports;
    }
    getBottomPorts(): cxPort[] {
        const ports = [];
        for (let i = 0; i < this.ports?.length; i++) {
            const port = this.ports[i];
            if (port.side === constants.gojs.C_BOTTOM)
                ports.push(port);
        }
        return ports;
    }
    getRelsConnectedToPort(portId: string): cxRelationship[] {
        const rels = new Array();
        const inputrels = this.inputrels;
        for (let i = 0; i < inputrels?.length; i++) {
            const rel = inputrels[i];
            if (rel.fromPortid === portId || rel.toPortid === portId) {
                rels.push(rel);
            }
        }
        const outputrels = this.outputrels;
        for (let i = 0; i < outputrels?.length; i++) {
            const rel = outputrels[i];
            if (rel.fromPortid === portId || rel.toPortid === portId) {
                rels.push(rel);
            }
        }
        return rels;
    }
}

export class cxPort extends cxMetaObject {
    side: string;
    color: string;
    type: cxObjectType;
    constructor(id: string, name: string, description: string, side: string, portType: cxObjectType | null = null) {
        super(id, name, description);
        this.side = side;
        this.color = 'white';
        this.type = portType;
    }
    // Methods
    setSide(side: string) {
        this.side = side;
    }
    getSide(): string {
        return this.side;
    }
    setColor(color: string) {
        this.color = color;
    }
    getColor(): string {
        return this.color;
    }
    getType(): cxObjectType {
        return this.type;
    }
}

export class cxRelationship extends cxInstance {
    relshipviews: cxRelationshipView[] | null;
    cardinality: string;
    cardinalityFrom: string;
    cardinalityTo: string;
    nameFrom: string;
    nameTo: string;
    fromPortid: string;
    toPortid: string;
    constructor(id: string, type: cxRelationshipType | null, fromObj: cxObject | null, toObj: cxObject | null, name: string, description: string) {
        super(id, name, type, description);
        this.category = constants.gojs.C_RELATIONSHIP;
        this.relshipviews = null;
        this.fromObject = fromObj as cxObject;
        this.toObject = toObj as cxObject;
        this.cardinality = "";
        this.cardinalityFrom = "";
        this.cardinalityTo = "";
        this.nameFrom = "";
        this.nameTo = "";
        this.fromPortid = "";
        this.toPortid = "";
        if (!this.typeName) this.typeName = name;
        if (this.type) {
            this.cardinality = this.getCardinality();
            this.cardinalityFrom = this.getCardinalityFrom();
            this.cardinalityTo = this.getCardinalityTo();
        }
        // Handle properties
        const props = this.type?.properties;
        for (let i = 0; i < props?.length; i++) {
            const prop = props[i];
            if (prop.name === 'id') continue;
            if (prop) this[prop.name] = "";
        }
        // toObj?.addInputrel(this);
        // fromObj?.addOutputrel(this);
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
    setFromPortid(pid: string) {
        this.fromPortid = pid;
    }
    getFromPortid(): string {
        return this.fromPortid;
    }
    setToPortid(pid: string) {
        this.toPortid = pid;
    }
    getToPortid(): string {
        return this.toPortid;
    }
    addRelationshipView(relview: cxRelationshipView) {
        if (!this.relshipviews)
            this.relshipviews = new Array();
        const len = this.relshipviews.length;
        for (let i = 0; i < len; i++) {
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
        for (let i = 0; i < len; i++) {
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
    getPurgedRelationshipViews(): cxRelationshipView[] | null {
        // Remove relationship views that are marked as deleted
        const relshipViews = this.relshipviews;
        for (let i = 0; i < relshipViews?.length; i++) {
            const relview = relshipViews[i];
            if (relview.markedAsDeleted) {
                relshipViews.splice(i, 1);
            }
        }
        return relshipViews;
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
            } else if (reltype.name === constants.types.AKM_ANNOTATES) {
                retval = true;
            }
            return retval;
        }
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

export class cxValue extends cxMetaObject {
    value: string;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.value = this.name;
    }
    // Methods
}

export class cxViewFormat extends cxMetaObject {
    viewFormat: string;
    constructor(id: string, name: string, description: string) {
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
    constructor(id: string, name: string, description: string) {
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
    constructor(id: string, name: string, description: string) {
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

export class cxModelView extends cxMetaObject {
    model: cxModel | null;
    viewstyle: cxViewStyle | null;
    viewstyles: cxViewStyle[] | null;
    objecttypeviews: cxObjectTypeView[] | null;
    relshiptypeviews: cxRelationshipTypeView[] | null;
    objectviews: cxObjectView[] | null;
    relshipviews: cxRelationshipView[] | null;
    focusObjectview: cxObjectView | null;
    scale: string;
    memberscale: string;
    layout: string;
    routing: string;
    linkcurve: string;
    showCardinality: boolean;
    showRelshipNames: boolean;
    askForRelshipName: boolean;
    includeInheritedReltypes: boolean | null;
    template: any;
    isTemplate: boolean;
    diagram: any;
    diagrams: cxDiagram[] | null;
    constructor(id: string, name: string, model: cxModel | null, description: string) {
        super(id, name, description);
        this.category = constants.gojs.C_MODELVIEW;
        this.model = model;
        this.viewstyle = null; // Default viewstyle
        this.viewstyles = null;
        this.objecttypeviews = null;
        this.relshiptypeviews = null;
        this.objectviews = null;
        this.relshipviews = null;
        this.focusObjectview = null;
        this.scale = "1";
        this.memberscale = constants.params.MEMBERSCALE;
        this.layout = "ForceDirected";
        this.routing = "Normal";
        this.linkcurve = "None";
        this.showCardinality = false;
        this.showRelshipNames = true;
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
        this.showRelshipNames = true;
        this.askForRelshipName = false;
        this.template = null;
        this.isTemplate = false;
        this.diagrams = null;
    }
    clearRelviewPoints() {
        const relshipviews = this.relshipviews;
        if (relshipviews) {
            for (let i = 0; i < relshipviews.length; i++) {
                const relview = relshipviews[i];
                relview.points = null;
            }
        }
    }
    setModel(model: cxModel) {
        this.model = model;
    }
    getModel(): cxModel {
        return this.model;
    }
    setFocusObjectview(objview: cxObjectView) {
        this.focusObjectview = objview;
    }
    getFocusObjectview(): cxObjectView {
        return this.focusObjectview;
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
    getObjectViews(): cxObjectView[] | null {
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
    getRelationshipViewsByTypeName(reltypeName: string, kind: string): cxRelationship[] | null {
        let relshipviews = new Array();
        if (this.relshipviews) {
            for (let i = 0; i < this.relshipviews.length; i++) {
                let relview = this.relshipviews[i];
                let rel = relview.relship;
                if (relview.name === reltypeName && !rel.markedAsDeleted) {
                    if (rel.relshipkind === kind)
                        relshipviews.push(relview);
                }
            }
        }
        return relshipviews;
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
            if (debug) console.log('7870 Add reltypeView', reltypeView);
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
        for (let i = 0; i < len; i++) {
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
        let objview: cxObjectView = null;
        while (i < this.objectviews.length) {
            objview = this.objectviews[i];
            if (!objview?.isDeleted()) {
                if (objview.id === id) {
                    if (!objview.objectRef) {
                        const obj = objview.object;
                        if (obj)
                            objview.objectRef = obj.id;
                    }
                    return objview;
                }
            }
            i++;
        }
    }
    findObjectViewByName(name: string): cxObjectView | null {
        if (!this.objectviews) return null;
        let i = 0;
        let objview = null;
        while (i < this.objectviews.length) {
            objview = this.objectviews[i];
            if (!objview?.isDeleted()) {
                const obj = objview.object;
                if (obj?.name === name)
                    return objview;
            }
            i++;
        }
    }
    findObjectViewsByObject(obj: cxObject): cxObjectView[] | null {
        const objviews = new Array();
        let oviews = this.objectviews;
        if (!oviews)
            return null;
        for (let i = 0; i < oviews.length; i++) {
            const ov = oviews[i];
            if (ov.isDeleted())
                continue;
            if (ov && obj) {
                if (ov.object?.id === obj.id) {
                    objviews.push(ov);
                }
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
            if (!obj?.isDeleted()) {
                if (obj.id === id)
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
            if (!rv?.isDeleted()) {
                if (rv.id === id)
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
        for (let i = 0; i < rviews.length; i++) {
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
            for (let i = 0; i < rviews.length; i++) {
                const rv: cxRelationshipView = rviews[i];
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
            }
            i++;
        }
        return null;
    }
    getRelviewsByFromAndToObjviews(fromView: cxObjectView, toView: cxObjectView): cxRelationshipView[] {
        const relviews = new Array();
        if (fromView && toView) {
            let rviews = this.relshipviews;
            if (!rviews)
                return null;
            for (let i = 0; i < rviews.length; i++) {
                const rv: cxRelationshipView = rviews[i];
                if (rv?.markedAsDeleted)
                    continue;
                if (rv?.fromObjview?.id === fromView.id) {
                    if (rv?.toObjview?.id === toView.id) {
                        relviews.push(rv);
                    }
                }
            }
        }
        return relviews;
    }
    getRelshipviewsInGroup(group: cxObjectView): cxRelationshipView[] | null {
        const relviews = new Array();
        const objviews = group.getGroupMembers(this);
        for (let i = 0; i < objviews?.length; i++) {
            const objview = objviews[i];
            const relviews1 = objview.getOutputRelviews();
            if (relviews1) {
                for (let j = 0; j < relviews1.length; j++) {
                    const relview = relviews1[j];
                    const toObjview = relview.getToObjectView();
                    if (toObjview?.group === group.id) {
                        relviews.push(relview);
                    }
                }
            }
        }
        return relviews;
    }
}

export class cxCollectionOfViews {
    modelview: cxModelView;
    objectviews: cxObjectView[] | null;
    relshipviews: cxRelationshipView[] | null;
    constructor(modelview: cxModelView) {
        this.modelview = modelview;
        this.objectviews = new Array(); // modelview.objectviews;
        this.relshipviews = new Array(); // modelview.relshipviews;
    }
    addObjectView(objview: cxObjectView) {
        if (!this.objectviews)
            this.objectviews = new Array();
        const len = this.objectviews.length;
        for (let i = 0; i < len; i++) {
            const ov = this.objectviews[i];
            if (ov.id === objview.id) {
                // Object view is already in list
                return;
            }
        }
        this.objectviews.push(objview);
    }
    addRelshipView(relview: cxRelationshipView) {
        if (!this.relshipviews)
            this.relshipviews = new Array();
        const len = this.relshipviews.length;
        for (let i = 0; i < len; i++) {
            const rv = this.relshipviews[i];
            if (rv.id === relview.id) {
                // Relship view is already in list
                return;
            }
        }
        this.relshipviews.push(relview);
    }
}

export class cxObjectView extends cxMetaObject {
    modelview: cxModelView | null;
    category: string;
    object: cxObject | null;
    objectRef: string;
    inputrelviews: cxRelationshipView[] | null;
    outputrelviews: cxRelationshipView[] | null;
    typeview: cxObjectTypeView | null;
    typeviewRef: string;
    group: string;
    isGroup: boolean;
    groupLayout: string;
    parent: string;
    isExpanded: boolean;
    isSelected: boolean;
    visible: boolean;
    grabIsAllowed: boolean;
    text: string;
    loc: string;
    size: string;
    scale: string;
    scale1: string;
    memberscale: string;
    arrowscale: string;
    viewkind: string;
    template: string;
    // figure: string;
    // geometry: string;
    icon: string;
    image: string;
    routing: string;
    linkcurve: string;
    fillcolor: string;
    fillcolor1: string;
    fillcolor2: string;
    strokecolor: string;
    strokecolor1: string;
    strokecolor2: string;
    strokewidth: string;
    textcolor: string;
    textcolor2: string;
    textscale: string;
    constructor(id: string, name: string, object: cxObject | null, description: string, modelview: cxModelView | null) {
        super(id, name, description);
        this.modelview = modelview;
        this.category = constants.gojs.C_OBJECTVIEW;
        this.markedAsDeleted = false;
        this.object = object;
        this.objectRef = object?.id;
        this.inputrelviews = null;
        this.outputrelviews = null;
        this.typeview = object?.type?.typeview as cxObjectTypeView;
        this.typeviewRef = this.typeview?.id;
        this.group = "";
        this.isGroup = false;
        this.groupLayout = "";
        this.parent = "";
        this.isExpanded = true;
        this.isSelected = false;
        this.text = "";
        this.visible = true;
        this.grabIsAllowed = false;
        this.viewkind = "";
        this.loc = "";
        this.size = "";
        this.scale = "1";
        this.scale1 = "1";
        this.memberscale = this.typeview?.memberscale ? this.typeview.memberscale : "1";
        this.arrowscale = this.typeview?.arrowscale ? this.typeview.arrowscale : "1.3";
        this.textscale = this.typeview?.textscale ? this.typeview.textscale : "1";
        this.template = "";
        // this.figure = "";
        // this.geometry = "";
        this.routing = "Normal";
        this.linkcurve = "None";
        this.fillcolor = "";
        this.fillcolor1 = "";
        this.fillcolor2 = "";
        this.strokecolor = "";
        this.strokecolor1 = "";
        this.strokecolor2 = "";
        this.strokewidth = "1";
        this.textcolor = "";
        this.textcolor2 = "";
        this.icon = "";
        this.image = "";
    }
    // Methods
    setModelView(modelview: cxModelView) {
        this.modelview = modelview;
    }
    getModelView(): cxModelView | null {
        return this.modelview;
    }
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
    addInputRelview(relview: cxRelationshipView) {
        if (!this.inputrelviews)
            this.inputrelviews = new Array();
        const len = this.inputrelviews.length;
        for (let i = 0; i < len; i++) {
            const rv = this.inputrelviews[i];
            if (rv.id === relview.id) {
                // Relationship view is already in list
                return;
            }
        }
        this.inputrelviews.push(relview);
    }
    removeInputRelview(relview: cxRelationshipView) {
        if (!this.inputrelviews)
            return;
        const relviews = new Array();
        const len = this.inputrelviews.length;
        for (let i = 0; i < len; i++) {
            const rv = this.inputrelviews[i];
            if (rv.id !== relview.id) {
                relviews.push(relview);
            }
        }
        this.inputrelviews = relviews;
    }
    addOutputRelview(relview: cxRelationshipView) {
        if (!this.outputrelviews)
            this.outputrelviews = new Array();
        const len = this.outputrelviews.length;
        for (let i = 0; i < len; i++) {
            const rv = this.outputrelviews[i];
            if (rv.id === relview.id) {
                // Relationship is already in list
                return;
            }
        }
        this.outputrelviews.push(relview);
    }
    removeOutputRelview(relview: cxRelationshipView) {
        if (!this.outputrelviews)
            return;
        const relviews = new Array();
        const len = this.outputrelviews.length;
        for (let i = 0; i < len; i++) {
            const rv = this.outputrelviews[i];
            if (rv.id !== relview.id) {
                relviews.push(rv);
            }
        }
        this.outputrelviews = relviews;
    }
    getInputRelviews(): cxRelationshipView[] | null {
        return this.inputrelviews;
    }
    getOutputRelviews(): cxRelationshipView[] | null {
        return this.outputrelviews;
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
    setImage(image: string) {
        this.icon = icon;
    }
    getImage(): string {
        if (this.image)
            return this.image;
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
    setGroupIsExpanded(flag: boolean) {
        this.isExpanded = flag;
    }
    getGroupIsExpanded(): boolean {
        if (utils.objExists(this.isExpanded))
            return this.isExpanded;
        return false;
    }
    getParentModelView(model: cxModel): cxModelView | null {
        const mviews = model.modelviews;
        for (let i = 0; i < mviews.length; i++) {
            const mview = mviews[i];
            if (mview) {
                const objviews = mview.objectviews;
                for (let j = 0; j < objviews.length; j++) {
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
            for (let i = 0; i < objviews?.length; i++) {
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
    // setFigure(figure: string) {
    //     if (figure == undefined)
    //     figure = "";
    //     this.figure = figure;
    // }
    // getFigure(): string {
    //     if (this.template == undefined)
    //         return "";
    //     return this.template;
    // }
    setGrabIsAllowed(flag: boolean) {
        this.grabIsAllowed = flag;
    }
    getGrabIsAllowed(): boolean {
        return this.grabIsAllowed;
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
        if (scale == undefined || scale == "" || scale == null)
            scale = "1";
        this.scale = scale;
        this.scale1 = scale;
    }
    getScale(): string {
        const scale = this.scale1;
        if (scale == undefined || scale == "" || scale == null)
            return "1";
        return this.scale1;
    }
    setMemberscale(memberscale: string) {
        if (memberscale == undefined || memberscale == "" || memberscale == null)
            this.memberscale = this.typeview?.memberscale ? this.typeview.memberscale : "1";
        this.memberscale = memberscale;
    }
    getMemberscale(): string {
        const memberscale = this.memberscale;
        if (memberscale == undefined || memberscale == "" || memberscale == null)
            return this.typeview?.memberscale ? this.typeview.memberscale : "1";
        return this.memberscale;
    }
    setArrowscale(arrowscale: string) {
        if (arrowscale == undefined || arrowscale == "" || arrowscale == null)
            this.arrowscale = this.typeview?.arrowscale ? this.typeview.arrowscale : "1.3";
        this.arrowscale = arrowscale;
    }
    getArrowscale(): string {
        const arrowscale = this.arrowscale;
        if (arrowscale == undefined || arrowscale == "" || arrowscale == null)
            return this.typeview?.arrowscale ? this.typeview.arrowscale : "1.3";
        return this.arrowscale;
    }
    setTextscale(scale: string) {
        if (scale == undefined || scale == "" || scale == null)
            scale = "1";
        this.textscale = scale;
    }
    getTextscale(): string {
        const scale = this.textscale;
        if (scale == undefined || scale == "" || scale == null)
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
    applyTypeview() {
        let viewdata = this.typeview?.data;
        if (!viewdata) {
            const obj = this.getObject();
            if (obj) {
                const objtype = obj.getType();
                if (objtype) {
                    const typeview = objtype.typeview;
                    if (typeview) {
                        viewdata = typeview.data;
                    }
                }
            }
        }
        for (let k in viewdata) {
            if (k === 'class') continue;
            if (k === 'abstract') continue;
            if (k === 'isGroup') continue;
            if (k === 'group') continue;
            if (k === 'viewkind') continue;
            this[k] = viewdata[k];
        }

    }
    clearViewdata() {
        let viewdata = this.typeview?.data;
        if (!viewdata) {
            const obj = this.getObject();
            if (obj) {
                const objtype = obj.getType();
                if (objtype) {
                    const typeview = objtype.typeview;
                    if (typeview) {
                        viewdata = typeview.data;
                    }
                }
            }
        }
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
    category: string;
    fs_collection: string;
    relship: cxRelationship | null;
    typeview: cxRelationshipTypeView | null;
    fromObjview: cxObjectView | null;
    toObjview: cxObjectView | null;
    fromPortid: string;
    toPortid: string;
    template: string;
    arrowscale: string;
    strokecolor: string;
    strokewidth: string;
    textcolor: string;
    textscale: string;
    dash: string;
    fromArrow: string;
    toArrow: string;
    fromArrowColor: string;
    toArrowColor: string;
    routing: string;
    corner: string;
    curve: string;
    points: any;
    visible: boolean;
    constructor(id: string, name: string, relship: cxRelationship | null, description: string) {
        super(id, name, description);
        this.category = constants.gojs.C_RELSHIPVIEW;
        this.relship = relship;
        this.typeview = relship?.type?.typeview as cxRelationshipTypeView;
        this.markedAsDeleted = false;
        this.fromObjview = null;
        this.fromPortid = "";
        this.toPortid = "";
        this.toObjview = null;
        this.template = "";
        this.textscale = "1";
        this.arrowscale = "1";
        this.strokecolor = "black";
        this.strokewidth = "1";
        this.textcolor = "black";
        this.dash = "";
        this.fromArrow = "";
        this.toArrow = "";
        this.fromArrowColor = "";
        this.toArrowColor = "";
        this.routing = "";
        this.curve = "";
        this.corner = "";
        this.points = [];
        this.visible = true;
        this.isLayoutPositioned = false;
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
        if (scale == undefined || scale == "" || scale == null)
            scale = "1";
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
    getFromArrow(): string {
        if (this.fromArrow == undefined)
            return "";
        return this.fromArrow;
    }
    setFromArrowColor(color: string) {
        this.fromArrowColor = color;
    }
    getFromArrowColor(): string {
        if (this.fromArrowColor == undefined)
            return "";
        return this.fromArrowColor;
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
                this.setFromArrow('');
                this.setFromArrowColor('');
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
    getToArrow(): string {
        if (this.toArrow == undefined)
            return "";
        return this.toArrow;
    }
    setToArrowColor(color: string) {
        this.toArrowColor = color;
    }
    getToArrowColor(): string {
        if (this.toArrowColor == undefined)
            return "";
        return this.toArrowColor;
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
    setCurve(curve: string) {
        this.curve = curve;
    }
    getCurve(): string {
        if (this.curve == undefined)
            return "";
        return this.curve;
    }
    setCorner(corner: string) {
        this.corner = corner;
    }
    getCorner(): string {
        if (this.corner == undefined)
            return "";
        return this.corner;
    }
    setRouting(routing: string) {
        this.routing = routing;
    }
    getRouting(): string {
        if (this.routing == undefined)
            return "";
        return this.routing;
    }
    setDash(dash: string) {
        this.dash = dash;
    }
    getDash(): string {
        if (this.dash == undefined)
            return "";
        return this.dash;
    }
    setStrokeColor(color: string) {
        this.strokecolor = color;
    }
    getStrokeColor(): string {
        if (this.strokecolor == undefined)
            return "";
        return this.strokecolor;
    }
    setStrokeWidth(width: string) {
        this.strokewidth = width;
    }
    getStrokeWidth(): string {
        if (this.strokewidth == undefined)
            return "1";
        return this.strokewidth;
    }
    setTextColor(color: string) {
        this.textcolor = color;
    }
    getTextColor(): string {
        if (this.textcolor == undefined)
            return "";
        return this.textcolor;
    }
    setPoints(points: any) {
        this.points = points;
    }
    getPoints(): any {
        return this.points;
    }
}

export class cxGeometry extends cxMetaObject {
    geometry: string;
    stroke: string;
    fill: string;
    constructor(id: string, name: string, description: string) {
        super(id, name, description);
        this.geometry = "";
        this.stroke = "";
        this.fill = "";
    }
    // Methods
    setGeometry(geo: string, stroke: string, fill: string) {
        this.geometry = geo;
        this.stroke = stroke;
        this.fill = fill;
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

export class cxIdent {
    id: string;
    name: string;
    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}

export class cxNodeAndLinkMaps {copyPasteLinkMap
    fromModel: cxModel;
    toModel: cxModel;
    fromModelView: cxModelView;
    toModelView: cxModelView;
    nodeMaps: cxNodeMap[];
    linkMaps: cxLinkMap[];
    constructor(model1: cxModel, model2: cxModel, 
                modelview1: cxModelView, modelview2: cxModelView) {
        this.fromModel = model1;
        this.toModel = model2;
        this.fromModelView = modelview1;
        this.toModelView = modelview2;
        this.nodeMaps = new Array();
        this.linkMaps = new Array();
    }
    addNodeMap(map: cxNodeMap) {
        this.nodeMaps.push(map);
    }
    addLinkMap(map: cxLinkMap) {
        this.linkMaps.push(map);
    }
    replaceLinkMap(linkMap: cxLinkMap) {
        for (let i = 0; i < this.linkMaps.length; i++) {
            let map = this.linkMaps[i];
            if (map.inst.id === linkMap.inst.id) {
                if (map.fromNodeKey === linkMap.fromNodeKey) {
                    if (map.toNodeKey === linkMap.toNodeKey) {
                        if (map.fromLinkKey === linkMap.fromLinkKey) {
                            map = linkMap;
                            break;
                        }
                    }
                }
            }
        }
    }
    getNodeMap(inst: cxInstance, fromKey: string, toKey: string): cxNodeMap {
        for (let i = 0; i < this.nodeMaps.length; i++) {
            const map = this.nodeMaps[i];
            if (map.inst.id === inst.id) {
                if (map.fromSourceKey === fromKey) {
                    return map;
                }
            }
        }
        return null;
    }
    getLinkMap(name: string, fromLinkKey: string, toNodeKey: string): cxLinkMap {
        for (let i = 0; i < this.linkMaps.length; i++) {
            const map = this.linkMaps[i];
            if (map.name === name) {
                if (map.fromLinkKey === fromLinkKey) {
                    if (map.toNodeKey === toNodeKey)
                        return map;
                }
            }
        }
        return null;
    }
    getNodeMapByToGroup(group: string): cxNodeMap {
        for (let i = 0; i < this.nodeMaps.length; i++) {
            const map = this.nodeMaps[i];
            if (map.toGroup === group)
                return map;
        }
        return null;
    }
    setFromModelView(modelview: cxModelView) {
        this.fromModelView = modelview;
    }
    setFromModel(model: cxModel) {
        this.fromModel = model;
    }
    setToModelView(modelview: cxModelView) {
        this.toModelView = modelview;
    }
    setToModel(model: cxModel) {
        this.toModel = model;
    }
    alignNodeMaps() {
        for (let i = 0; i < this.nodeMaps.length; i++) {
            const map = this.nodeMaps[i];
        }
    }
    replaceNodeKeys(fromKey: string, toKey: string) {
        for (let i = 0; i < this.nodeMaps.length; i++) {
            const nodeMap = this.nodeMaps[i];
            if (nodeMap.toTargetKey === fromKey) 
                nodeMap.toTargetKey = toKey;
            if (nodeMap.toGroupKey === fromKey)
                nodeMap.toGroupKey = toKey;
        }
    }
}

export class cxLinkMap {
    inst: cxInstance;
    name: string;
    sourceFromNodeKey: string;
    sourceToNodeKey: string;
    targetFromNodeKey: string;
    targetToNodeKey: string;
    sourceLinkKey: string;
    targetLinkKey: string;
    constructor(inst: cxInstance, sourceFromKey: string, sourceToKey: string, sourceLinkKey: string, targetLinkKey: string) {
        this.inst = inst;
        this.name = inst.name;
        this.sourceFromNodeKey = sourceFromKey;
        this.sourceToNodeKey = sourceToKey;
        this.targetFromNodeKey = "";
        this.targetToNodeKey = "";
        this.sourceLinkKey = sourceLinkKey;
        this.targetLinkKey = targetLinkKey;
    }    
}

export class cxNodeMap {
    inst: cxInstance;
    name: string;
    fromSourceKey: string;
    toTargetKey: string;
    isGroup: boolean;
    fromGroupKey: string;
    toGroupKey: string;
    fromLoc: string;
    toLoc: string;
    constructor(inst: cxInstance, from: string, to: string, isGroup: boolean, fromGroupKey: string, toGroupKey: string , fromLoc: string, toLoc: string) {
        this.inst = inst;
        this.name = inst.name;
        this.isGroup = isGroup;
        this.fromSourceKey = from;        // The from key
        this.toTargetKey = to;            // The to key
        this.fromGroupKey = fromGroupKey; // The group key
        this.toGroupKey = toGroupKey;
        this.fromLoc = fromLoc;
        this.toLoc = toLoc;
    }
    setToGroup(grp: string) {
        this.toGroup = grp;
    }
    setFromLoc(loc: string) {
        this.fromLoc = loc;
    }
    setToLoc(loc: string) {
        this.toLoc = loc;
    }
    setInstance(inst: cxInstance) {
        this.inst = inst;
    }
    getInstance() {
        return this.inst;
    }
    addMap(name: string, from: string, to: string, isGroup: boolean, group: string) {
        this.name = name;
        this.fromSource = from;
        this.toTarget = to;
        this.fromGroup = group;
        this.toGroup = "";
        this.isGroup = isGroup;
    }
    getMap(name: string): cxNodeMap {
        if (name === this.name)
            return this
    }
    getToTarget(fromSource: string): string {
        if (fromSource === this.fromSourceKey)
            return this.toTargetKey;
        return "";
    }
    getToGroup(toTarget: string): string {
        if (toTarget === this.toTarget)
            return this.group;
        return "";
    }
    isGroupMap(from: string): boolean {
        if (from === this.fromGroup)
            return this.isGroup;
        return false;
    }
    replaceId(oldId: string, newId: string) {
        if (this.fromSource === oldId)
            this.fromSource = newId;
        if (this.toTarget === oldId)
            this.toTarget = newId;
        if (this.fromGroup === oldId)
            this.fromGroup = newId;
        if (this.toGroup === oldId)
            this.toGroup = newId;
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