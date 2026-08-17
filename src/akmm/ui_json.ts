// @ts-nocheck
const debug = false; 

import * as akm from './metamodeller';
import * as utils from './utilities';
import * as constants from './constants';

let jsnMetis: akm.cxMetis;

export class jsnExportMetis {
    id:                         string;
    name:                       string;
    description:                string;
    metamodels:                 jsnMetaModel[];
    models:                     jsnModel[];
    submodels:                  jsnModel[];
    allowGenerateCurrentMetamodel: boolean;
    pasteViewsOnly:             boolean;
    deleteViewsOnly:            boolean;
    currentMetamodelRef:        string;
    currentModelRef:            string;
    currentModelviewRef:        string;
    currentTemplateModelRef:    string;
    currentTargetMetamodelRef:  string;
    currentTargetModelRef:      string;
    currentTargetModelviewRef:  string;
    currentTaskModelRef:        string;
    // Constructor
    constructor(metis: akm.cxMetis, includeViews: boolean) {
        this.id                             = metis.id;
        this.name                           = metis.name;
        this.description                    = metis.description;
        this.allowGenerateCurrentMetamodel  = metis.allowGenerateCurrentMetamodel;
        this.metamodels                     = [];
        this.models                         = [];
        this.submodels                      = [];
        this.currentMetamodelRef            = "";
        this.currentModelRef                = "";
        this.currentModelviewRef            = "";
        this.currentTemplateModelRef        = "";
        this.currentTargetMetamodelRef      = "";
        this.currentTargetModelRef          = "";
        this.currentTargetModelviewRef      = "";
        this.currentTaskModelRef            = "";
        // Code
        if (metis) {
            jsnMetis = metis;
            const metamodels = metis.getMetamodels();
            if (metamodels) {
                const cnt = metamodels.length;
                for (let i = 0; i < cnt; i++) {
                    const metamodel = metamodels[i];
                    this.addMetamodel(metamodel, includeViews);
                }
            }
            const models = metis.getModels();
            if (models) {
                const cnt = models.length;
                for (let i = 0; i < cnt; i++) {
                    const model = models[i];
                    this.addModel(model, includeViews);
                }
            }
            const submodels = metis.getSubModels();
            if (submodels) {
                const cnt = submodels.length;
                for (let i = 0; i < cnt; i++) {
                    const model = submodels[i];
                    this.addSubModel(model, includeViews);
                }
            }
            if (metis.currentMetamodel)
                this.currentMetamodelRef = metis.currentMetamodel.id;
            if (metis.currentModel)
                this.currentModelRef = metis.currentModel.id;
            if (metis.currentModelview)
                this.currentModelviewRef = metis.currentModelview.id;
            if (metis.currentTargetMetamodel)
                this.currentTargetMetamodelRef = metis.currentTargetMetamodel.id;
            if (metis.currentTargetModel)
                this.currentTargetModelRef = metis.currentTargetModel.id;
            if (metis.currentTargetModelview)
                this.currentTargetModelviewRef = metis.currentTargetModelview.id;
            if (metis.currentTemplateModel)
                this.currentTemplateModelRef = metis.currentTemplateModel.id;  
            if (metis.currentTaskModel)
                this.currentTaskModelRef = metis.currentTaskModel.id;
        }
    }
    // Functions
    addMetamodel(metamodel: akm.cxMetaModel, includeViews: boolean) {
        if (metamodel) {
            const jMetamodel = new jsnMetaModel(metamodel, includeViews);
            this.metamodels.push(jMetamodel);
        }
    }
    addModel(model: akm.cxModel, includeViews: boolean) {
        if (model && model.metamodel) {
            const jModel = new jsnModel(model, includeViews);
            this.models.push(jModel);
        }
    }
    addSubModel(model: akm.cxModel, includeViews: boolean) {
        if (model && model.metamodel) {
            const jModel = new jsnModel(model, includeViews);
            this.submodels.push(jModel);
        }
    }
}
export class jsnExportMetaModel {
    metamodels: jsnMetaModel[];
    constructor() {
        this.metamodels = new Array();
    }
    addMetamodel(metamodel: akm.cxMetaModel, includeViews: boolean) {
        if (metamodel) {
            const jMetamodel = new jsnMetaModel(metamodel, includeViews);
            this.metamodels.push(jMetamodel);
        }
    }
}
export class jsnDatatype {
    id:                 string;
    name:               string;
    description:        string;
    datatypeRef:        string | undefined;
    allowedValues:      string[];
    defaultValue:       string;
    readOnly:           boolean;
    value:              string;
    inputPattern:       string;
    viewFormat:         string;
    fieldType:          string;
    markedAsDeleted:    boolean;
    modified:           boolean;
    constructor(dtype: akm.cxDatatype) {
        this.id              = dtype.id;
        this.name            = dtype.name;
        this.description     = "";
        this.datatypeRef     = dtype.isOfDatatype?.id;
        this.allowedValues   = dtype.allowedValues;
        this.defaultValue    = dtype.defaultValue;
        this.readOnly        = dtype.readOnly;
        this.value           = dtype.value;
        this.inputPattern    = dtype.inputPattern;
        this.viewFormat      = dtype.viewFormat;
        this.fieldType       = dtype.fieldType;
        this.markedAsDeleted = dtype.markedAsDeleted;
        this.modified        = dtype.modified;
        // Code
        if (utils.objExists(dtype.description))
            this.description = dtype.description;
        if (dtype.getIsOfDatatype()) {
            const dtypeOf = dtype.getIsOfDatatype();
            this.datatypeRef = dtypeOf?.id;
        }
    }
}
export class jsnViewStyle {
    id:              string;
    name:            string;
    description:     string;
    markedAsDeleted: boolean;
    modified:        boolean;
    constructor(vstyle: akm.cxViewStyle) {
        this.id              = vstyle.id;
        this.name            = vstyle.name;
        this.description     = "";
        this.markedAsDeleted = vstyle.markedAsDeleted;
        this.modified        = vstyle.modified;
        // Code
        if (vstyle.description)
            this.description = vstyle.description;
    }
}
export class jsnGeometry {
    id:              string;
    name:            string;
    description:     string;
    markedAsDeleted: boolean;
    modified:        boolean;
    constructor(geo: akm.cxGeometry) {
        this.id              = geo.id;
        this.name            = geo.name;
        this.description     = "";
        this.markedAsDeleted = geo.markedAsDeleted;
        this.modified        = geo.modified;
        // Code
        if (geo.description)
            this.description = geo.description;
    }
}
export class jsnMetaModel {
    id:                 string;
    name:               string;
    description:        string;
    metamodelRefs:      string[];
    subMetamodelRefs:   string[];
    subModelRefs:       string[];
    subModels:          jsnModel[] | null;
    viewstyles:         jsnViewStyle[] | null;
    geometries:         jsnGeometry[] | null;
    objecttypes:        jsnObjectType[];
    relshiptypes:       jsnRelationshipType[];
    objecttypes0:       jsnObjectType[];
    relshiptypes0:      jsnRelationshipType[];
    properties:         jsnProperty[];
    methods:            jsnMethod[];
    methodtypes:        jsnMethodType[];
    datatypes:          jsnDatatype[];
    units:              jsnUnit[];
    objecttypeviews:    jsnObjectTypeView[];
    objtypegeos:        jsnObjectTypegeo[];
    relshiptypeviews:   jsnRelshipTypeView[];
    generatedFromModelRef: string;
    includeInheritedReltypes: boolean;
    includeSystemtypes: boolean;
    layout:             string;
    routing:            string;
    linkcurve:          string;
    markedAsDeleted:    boolean;
    modified:           boolean;
    constructor(metamodel: akm.cxMetaModel, includeViews: boolean) {
        this.id = metamodel.id;
        this.name = metamodel.name;
        this.description = (metamodel.description) ? metamodel.description : "";
        this.metamodelRefs = [];
        this.subMetamodelRefs = [];
        this.subModelRefs = [];
        // this.subMetamodels = [];
        this.subModels = [];
        this.viewstyles = [];
        this.geometries = [];
        this.objecttypes = [];
        this.relshiptypes = [];
        this.objecttypes0 = [];
        this.relshiptypes0 = [];
        this.properties = [];
        this.datatypes = [];
        this.methodtypes = [];
        this.methods = [];
        this.units = [];
        this.objecttypeviews = [];
        this.objtypegeos = [];
        this.relshiptypeviews = []; 
        this.generatedFromModelRef = metamodel.generatedFromModelRef;
        this.includeInheritedReltypes = metamodel.includeInheritedReltypes;
        this.includeSystemtypes = metamodel.includeSystemtypes;
        this.layout           = metamodel.layout;
        this.routing          = metamodel.routing;
        this.linkcurve        = metamodel.linkcurve;
        this.markedAsDeleted  = metamodel.markedAsDeleted;
        this.modified = false;

        if (true) { // Code
        let metamodels = metamodel.getContainedMetamodels();
        if (metamodels) {
            const cnt = metamodels.length;
            for (let i = 0; i < cnt; i++) {
                const metamodel = metamodels[i];
                if (!metamodel) break;
                this.metamodelRefs.push(metamodel.id);
            }
        }
        this.subMetamodelRefs = metamodel.getSubMetamodelRefs();
        let subModels = metamodel.getSubModels();
        if (subModels) {
            const cnt = subModels.length;
            for (let i = 0; i < cnt; i++) {
                const subModel = subModels[i];
                this.subModelRefs.push(subModel.id);
                const jsnSubmodel = new jsnModel(subModel, false);
                this.subModels.push(jsnSubmodel);
            }
        }
        }
        const objtypes = metamodel.getObjectTypes();
        if (objtypes) {
            const cnt = objtypes.length;
            for (let i = 0; i < cnt; i++) {
                const objtype = objtypes[i];
                this.addObjectType(objtype, includeViews);
            }
        }
        const objtypes0 = metamodel.getObjectTypes0();
        if (objtypes0) {
            const cnt = objtypes0.length;
            for (let i = 0; i < cnt; i++) {
                const objtype = objtypes0[i];
                this.addObjectType0(objtype, includeViews);
            }
        }
        const objtypegeos = metamodel.getObjtypeGeos();
        if (objtypegeos) {
            const cnt = objtypegeos.length;
            for (let i = 0; i < cnt; i++) {
                const objtypegeo = objtypegeos[i];
                this.addObjtypeGeo(objtypegeo);
            }
        }
        const reltypes = metamodel.getRelshipTypes();
        if (reltypes) {
            if (debug) console.log('195 reltypes', reltypes);
            const cnt = reltypes.length;
            for (let i = 0; i < cnt; i++) {
                const reltype = reltypes[i];
                if (!reltype.fromObjtype) {
                    if (reltype.fromobjtypeRef) {
                        const objtype = metamodel.findObjectType(reltype.fromobjtypeRef);
                        reltype.fromObjtype = objtype;
                    }
                }
                if (!reltype.toObjtype) {
                    if (reltype.toobjtypeRef) {
                        const objtype = metamodel.findObjectType(reltype.toobjtypeRef);
                        reltype.toObjtype = objtype;
                    }
                }
                this.addRelationshipType(reltype, includeViews);
            }
            if (debug) console.log('200 jsnMetaModel', this);
        }
        const reltypes0 = metamodel.getRelshipTypes0();
        if (reltypes0) {
            if (debug) console.log('195 reltypes0', reltypes0);
            const cnt = reltypes0.length;
            for (let i = 0; i < cnt; i++) {
                const reltype = reltypes0[i];
                if (!reltype) continue;
                if (!reltype.fromObjtype) {
                    if (reltype.fromobjtypeRef) {
                        const objtype = metamodel.findObjectType(reltype.fromobjtypeRef);
                        reltype.fromObjtype = objtype;
                    }
                }
                if (!reltype?.toObjtype) { // SF: added ?
                    if (reltype?.toobjtypeRef) { // SF: added ?
                        const objtype = metamodel.findObjectType(reltype.toobjtypeRef);
                        reltype.toObjtype = objtype;
                    }
                }
                this.addRelationshipType0(reltype, includeViews);
            }
            if (debug) console.log('200 jsnMetaModel', this);
        }
        const datatypes = metamodel.getDatatypes();
        if (datatypes) {
            const cnt = datatypes.length;
            for (let i = 0; i < cnt; i++) {
                const datatype = datatypes[i];
                this.addDataType(datatype);
            }
        }
        const properties = metamodel.getProperties();
        if (properties) {
            const cnt = properties.length;
            for (let i = 0; i < cnt; i++) {
                const prop = properties[i];
                this.addProperty(prop);
            }
        }
        const methodtypes = metamodel.getMethodTypes();
        if (methodtypes) {
            const cnt = methodtypes.length;
            for (let i = 0; i < cnt; i++) {
                const mtd = methodtypes[i];
                this.addMethodType(mtd);
            }
        }
        const methods = metamodel.getMethods();
        if (methods) {
            const cnt = methods.length;
            for (let i = 0; i < cnt; i++) {
                const mtd = methods[i];
                this.addMethod(mtd);
            }
        }
        this.updateMethods(metamodel);
        //
        // let units = metamodel.getUnits();
        // if (units) {
        //     let cnt = units.length;
        //     for (let i = 0; i < cnt; i++) {
        //         let unit = units[i];
        //         this.addUnit(unit);
        //     }
        // }
        if (includeViews) {
            const viewstyles = metamodel.getViewStyles();
            if (viewstyles) {
                const cnt = viewstyles.length;
                for (let i = 0; i < cnt; i++) {
                    const viewstyle = viewstyles[i];
                    this.addViewStyle(viewstyle);
                }
            }
            const geometries = metamodel.getGeometries();
            if (geometries) {
                const cnt = geometries.length;
                for (let i = 0; i < cnt; i++) {
                    const geo = geometries[i];
                    this.addGeometry(geo);
                }
            }
            const objtypeviews = metamodel.getObjectTypeViews();
            if (objtypeviews) {
                const cnt = objtypeviews.length;
                for (let i = 0; i < cnt; i++) {
                    const objtypeview = objtypeviews[i];
                    this.addObjectTypeView(objtypeview);
                }
            }
            let objtypegeos = metamodel.getObjtypeGeos();
            if (objtypegeos) {
                let cnt = objtypegeos.length;
                for (let i = 0; i < cnt; i++) {
                    let objtypegeo = objtypegeos[i];
                    this.addObjtypeGeo(objtypegeo);
                }
            }
            const reltypeviews = metamodel.getRelshipTypeViews();
            if (reltypeviews) {
                const cnt = reltypeviews.length;
                for (let i = 0; i < cnt; i++) {
                    const reltypeview = reltypeviews[i];
                    this.addRelshipTypeView(reltypeview);
                }
            }
        }
    }
    addMetamodel(metamodel: akm.cxMetaModel) {
        if (metamodel) {
            this.metamodelRefs.push(metamodel.id);
        }
    }
    addSubModel(model: akm.cxModel) {
        if (model) {
            for (let i=0; i<this.subModelRefs.length; i++) {
                const ref = this.subModelRefs[i];
                if (ref === model.id) {
                    // Model is already in list
                    return;
                }
            }
            this.subModelRefs.push(model.id);
            // const jModel = new jsnModel(model, false);
            // this.subModels.push(jModel);
        }
    }
    // addSubMetaModel(mmodel: jsnMetaModel) {
    //     if (mmodel) {
    //         this.subMetamodels.push(mmodel);
    //     }
    // }
    addObjectType(objtype: akm.cxObjectType, includeViews: boolean) {
        if (utils.objExists(objtype) &&
            !objtype.isDeleted()
        ) {
            const jsnObjtype = new jsnObjectType(objtype, includeViews);
            this.objecttypes.push(jsnObjtype);
        }
    }
    addObjectType0(objtype: akm.cxObjectType, includeViews: boolean) {
        if (utils.objExists(objtype) &&
            !objtype.isDeleted()
        ) {
            const jsnObjtype = new jsnObjectType(objtype, includeViews);
            this.objecttypes0.push(jsnObjtype);
        }
    }
    addRelationshipType(reltype: akm.cxRelationshipType, includeViews: boolean) {
        if (
            utils.objExists(reltype) &&
            !reltype.isDeleted() &&
            utils.objExists(reltype.fromObjtype) &&
            utils.objExists(reltype.toObjtype)
        ) {
            const jsnReltype = new jsnRelationshipType(reltype, includeViews);
            this.relshiptypes.push(jsnReltype);
        }
    }
    addRelationshipType0(reltype: akm.cxRelationshipType, includeViews: boolean) {
        if (
            utils.objExists(reltype) &&
            !reltype.isDeleted() &&
            utils.objExists(reltype.fromObjtype) &&
            utils.objExists(reltype.toObjtype)
        ) {
            const jsnReltype = new jsnRelationshipType(reltype, includeViews);
            this.relshiptypes0.push(jsnReltype);
        }
    }
    addDataType(datatype: akm.cxDatatype) {
        if (utils.objExists(datatype) &&
            !datatype.isDeleted()
        ) {
            const jDatatype = new jsnDatatype(datatype);
            this.datatypes.push(jDatatype);
        }
    }
    addProperty(prop: akm.cxProperty) {
        if (utils.objExists(prop) &&
            !prop.isDeleted()
        ) {
            const jsnProp = new jsnProperty(prop);
            this.properties.push(jsnProp);
        }
    }
    addMethodType(mtd: akm.cxMethodType) {
        if (mtd && !mtd.isDeleted()
        ) {
            const jsnMtd = new jsnMethodType(mtd);
            this.methodtypes.push(jsnMtd);
        }
    }
    addMethod(mtd: akm.cxMethod) {
        if (utils.objExists(mtd) &&
            !mtd.isDeleted()
        ) {
            const jsnMtd = new jsnMethod(mtd);
            this.methods.push(jsnMtd);
        }
    }
    addUnit(unit: akm.cxUnit) {
        if (utils.objExists(unit)) {
            let jUnit = new jsnUnit(unit);
            this.units.push(jUnit);        }
    }
    addViewStyle(vstyle: akm.cxViewStyle) {
        if (vstyle && !vstyle.isDeleted()) {
            const jViewStyle = new jsnViewStyle(vstyle);
            this.viewstyles.push(jViewStyle);
        }
    }
    addGeometry(geo: akm.cxGeometry) {
        if (geo && !geo.isDeleted()) {
            const jGeometry = new jsnGeometry(geo);
            this.geometries.push(jGeometry);
        }
    }
    addObjectTypeView(objtypeview: akm.cxObjectTypeView) {
        if (objtypeview && !objtypeview.isDeleted()
        ) {
            if (objtypeview.typeRef) {
                const jsnObjtypeview = new jsnObjectTypeView(objtypeview);
                this.objecttypeviews.push(jsnObjtypeview);
            }
        }
    }
    addObjtypeGeo(objtypegeo: akm.cxObjtypeGeo) {
        if (objtypegeo) {
            let jsnObjtypegeo = new jsnObjectTypegeo(objtypegeo);
            this.objtypegeos.push(jsnObjtypegeo);
        }
    }
    addRelshipTypeView(reltypeview: akm.cxRelationshipTypeView) {
        if (reltypeview &&
            !reltypeview.isDeleted()) {
            if (reltypeview.typeRef) {
                const jsnReltypeview = new jsnRelshipTypeView(reltypeview);
                this.relshiptypeviews.push(jsnReltypeview);
            }
        }
    }
    findObjectType(id: string): jsnObjectType {
        const objtypes = this.objecttypes;
        for (let i=0; i<objtypes.length; i++) {
            const objtype = objtypes[i];
            if (objtype.id === id) {
                return objtype;
            }
        }
        return null;
    }
    findRelationshipType(id: string): jsnRelationshipType {
        const reltypes = this.relshiptypes;
        for (let i=0; i<reltypes.length; i++) {
            const reltype = reltypes[i];
            if (reltype.id === id) {
                return reltype;
            }
        }
        return null;
    }
    findRelationshipType0(id: string): jsnRelationshipType {
        const reltypes = this.relshiptypes0;
        for (let i=0; i<reltypes.length; i++) {
            const reltype = reltypes[i];
            if (reltype.id === id) {
                return reltype;
            }
        }
        return null;
    }
    findMethod(id: string): jsnMethod {
        const methods = this.methods;
        for (let i=0; i<methods?.length; i++) {
            const method = methods[i];
            if (method.id === id) {
                return method;
            }
        }
        return null;
    }
    updateMethods(metamodel: akm.cxMetaModel) {
        const methods = metamodel.methods;
        let mtdprops = null;
        for (let i=0; i<methods?.length; i++) {
            const mtd = methods[i];
            if (mtd) {
                const jsnMtd = this.findMethod(mtd.id);
                const mtdtype = mtd["methodtype"];
                if (mtdtype) {
                    const mtype = metamodel.findMethodTypeByName(mtdtype); 
                    if (mtype) {
                        mtdprops = mtype.properties;
                        if (debug) console.log('359 this', mtdprops);
                        for (let j=0; j<mtdprops?.length; j++) {
                            const prop = mtdprops[j];
                            jsnMtd[prop.name] = mtd[prop.name];
                        }
                    }
                }
            }
        }        
    }
}
export class jsnObjectType {
    id:             string;
    name:           string;
    description:    string;
    abstract:       boolean;
    viewkind:       string;
    typename:       string;
    typedescription: string;
    typeviewRef:    string;
    properties:     jsnProperty[];
    attributes:     jsnAttribute[];
    methods:        jsnMethod[];
    ports:          jsnPort[];
    markedAsDeleted: boolean;
    modified:       boolean;
    constructor(objtype: akm.cxObjectType, includeViews: boolean) {
        this.id             = objtype.id;
        this.name           = objtype.name;
        this.abstract       = objtype.abstract;
        this.viewkind       = objtype.viewkind;
        this.typename       = 'Object type';
        this.typedescription = "";
        this.typeviewRef    = objtype.typeview ? objtype.typeview.id : "";
        this.description    = (objtype.description) ? objtype.description : "";
        this.properties     = [];
        this.attributes     = [];
        this.methods        = [];
        this.ports          = [];
        this.markedAsDeleted = objtype.markedAsDeleted;
        this.modified       = objtype.modified;
        // Code
        let props: akm.cxProperty[];
        try {
            props = objtype?.getProperties(false);
        } catch (error) {
            props = [];
        }
        let cnt = props?.length;
        for (let i = 0; i < cnt; i++) {
            const prop = props[i];
            this.addProperty(prop);
        }

        let attrs: akm.cxAttribute[];
        try {
            attrs = objtype?.getAttributes();
        } catch (error) {
            attrs = [];
        }
        cnt = attrs?.length;
        for (let i = 0; i < cnt; i++) {
            const attr = attrs[i];
            this.addAttribute(attr);            
        }

        let ports: akm.cxPort[];
        try {
            const ports = objtype.getPorts();
            for (let i = 0; i < cnt; i++) {
                const port = ports[i];
                this.addPort(port);
            }
        } catch (error) {
            ports = [];
        }
        cnt = ports?.length;
        for (let i = 0; i < cnt; i++) {
            const port = ports[i];
            this.addPort(port);
        }

        let mtds: akm.cxMethod[];
        try {
            mtds = objtype.getMethods();
        } catch (error) {
            mtds = [];
        }   
        cnt = mtds?.length;
        for (let i = 0; i < cnt; i++) {
            const mtd = mtds[i];
            this.addMethod(mtd);
        }
        if (debug) console.log('610 objtype, props, this', objtype, props, this);
        //this.loc  = (includeViews) ? objtype.loc : "";
        //this.size = (includeViews) ? objtype.size : "";
    }
    addProperty(prop: akm.cxProperty) {
        if (prop) {
            const gProperty = new jsnProperty(prop);
            if (debug) console.log('465 prop, gProperty', prop, gProperty);
            this.properties.push(gProperty);
        }
    }
    addMethod(mtd: akm.cxMethod) {
        if (mtd) {
            const gMethod = new jsnMethod(mtd);
            if (debug) console.log('352 mtd, gProperty', mtd, gMethod);
            this.methods.push(gMethod);
        }
    }
    addAttribute(attr: akm.cxAttribute) {
        if (attr) {
            const jAttr = new jsnAttribute(attr);
            if (debug) console.log('479 jAttr, jAttr', attr, jAttr);
            this.attributes.push(jAttr);
        }
    }
    addPort(port: jsnPort) {
        let ports, len;
        if (!this.ports)
            this.ports = new Array();
        ports = this.ports;
        len = ports?.length;
        for (let i=0; i<len; i++) {
            const p = ports[i];
            if (p.id === port.id) {
                // Port is already in list
                return;
            }
            ports.push(port);
        }
    }
    getPortsBySide(side: string): jsnPort[] | null {   
        const ports = [];
        const len = this.ports.length;
        for (let i=0; i<len; i++) {
            const p = this.ports[i];
            if (p.side === side) {
                ports.push(p);
            }
        }
        return ports;   
    }
}
export class jsnRelationshipType {
    id:             string;
    name:           string;
    description:    string;
    typeviewRef:    string;
    supertypes:     jsnObjectType[];
    properties:     jsnProperty[];
    relshipkind:    string;
    viewkind:       string;
    fromobjtypeRef: string;
    toobjtypeRef:   string;
    cardinality:    string;
    cardinalityFrom: string;
    cardinalityTo:  string;
    nameFrom:       string;
    nameTo:         string;
    markedAsDeleted: boolean;
    modified:       boolean;
    constructor(reltype: akm.cxRelationshipType, includeViews: boolean) {
        this.id             = reltype.id;
        this.name           = reltype.name;
        this.relshipkind    = reltype.relshipkind;
        this.viewkind       = reltype.viewkind;
        this.fromobjtypeRef = reltype.fromobjtypeRef ? reltype.fromobjtypeRef : reltype.fromObjtype?.id;
        this.toobjtypeRef   = reltype.toobjtypeRef ? reltype.toobjtypeRef : reltype.toObjtype?.id;
        this.typeviewRef    = "";
        this.description    = (reltype.description) ? reltype.description : "";
        this.supertypes     = [];
        this.properties     = [];
        this.cardinality    = reltype.cardinality;
        this.cardinalityFrom = reltype.cardinalityFrom;
        this.cardinalityTo   = reltype.cardinalityTo;
        this.nameFrom       = reltype.nameFrom;
        this.nameTo         = reltype.nameTo;
        this.markedAsDeleted = reltype.markedAsDeleted;
        this.modified       = reltype.modified;
        if (includeViews) {
            this.typeviewRef = (reltype.typeview) ? reltype.typeview.id : "";
        }
        // Code
        let props: akm.cxProperty[];
        try {
            props = reltype?.getProperties(false);
        } catch (error) {
            props = [];
        }
        let cnt = props?.length;
        for (let i = 0; i < cnt; i++) {
            const prop = props[i];
            this.addProperty(prop);
        }

        let supertypes: akm.cxObjectType[];
        try {
            supertypes = reltype.getSupertypes();
        } catch (error) {
            supertypes = [];
        }
        for (let i=0; i<supertypes.length; i++) {
            const stype = supertypes[i];
            if (stype)
                this.addSupertype(stype);
        }
    }
    addProperty(prop: akm.cxProperty) {
        if (prop) {
            const gProperty = new jsnProperty(prop);
            this.properties.push(gProperty);
        }
    }
    
    addSupertype(stype: akm.cxObjectType) {
        if (stype) {
            const gtype = new jsnObjectType(stype);
            this.supertypes.push(gtype);
        }
    }
}
export class jsnExportDatatypes {
    datatypes: jsnDatatype[];
    constructor() {
        this.datatypes = new Array();
    }

    addDatatype(datatype: akm.cxDatatype) {
        if (utils.objExists(datatype)) {
            const jDatatype = new jsnDatatype(datatype);
            this.datatypes.push(jDatatype);
        }
    }
}
export class jsnUnitCategory {
    id:              string;
    name:            string;
    description:     string;
    markedAsDeleted: boolean;
    modified:        boolean;
    constructor(utype: akm.cxUnitCategory) {
        this.id              = utype.id;
        this.name            = utype.name;
        this.description     = "";
        this.markedAsDeleted = utype.markedAsDeleted;
        this.modified        = utype.modified;
        // Code
        if (utils.objExists(utype.description))
            this.description = utype.description;
    }
}
export class jsnUnit {
    id:              string;
    name:            string;
    description:     string;
    markedAsDeleted: boolean;
    modified:        boolean;
    constructor(unit: akm.cxUnit) {
        this.id              = unit.id;
        this.name            = unit.name;
        this.description     = "";
        this.markedAsDeleted = unit.markedAsDeleted;
        this.modified        = unit.modified;
        // Code
        if (utils.objExists(unit.description))
            this.description = unit.description;
    }
}
export class jsnObjectTypeView {
    id:              string;
    name:            string;
    description:     string;
    typeRef:         string;
    icomStyle:       string;
    viewkind:        string;
    isGroup:         boolean;
    group:           string;
    groupLayout:     string;
    grabIsAllowed:   boolean;
    template:        string;
    template2:       string;
    figure:          string;
    geometry:        string;
    fillcolor:       string;
    fillcolor2:      string;
    strokecolor:     string;
    strokecolor1:    string;
    strokecolor2:    string;
    strokewidth:     number;
    textcolor:       string;
    textcolor2:      string;
    textscale:       number;
    memberscale:     number;
    icon:            string;
    image:           string;
    markedAsDeleted: boolean;
    modified:        boolean;
    constructor(objtypeview: akm.cxObjectTypeView) {
        this.id              = objtypeview.id;
        this.name            = objtypeview.name;
        this.description     = "";
        this.typeRef         = objtypeview.typeRef;
        this.icomStyle       = objtypeview.getIcomStyle();
        this.viewkind        = objtypeview.getViewKind();
        this.template        = objtypeview.getTemplate();
        // this.template2       = objtypeview.getTemplate2();
        this.figure          = objtypeview.getFigure();
        this.figure2         = objtypeview.getFigure2();
        this.geometry        = objtypeview.getGeometry();
        this.groupLayout     = objtypeview.getGroupLayout();
        this.fillcolor       = objtypeview.getFillcolor();
        this.fillcolor2      = objtypeview.getFillcolor2();
        this.strokecolor     = objtypeview.getStrokecolor();
        this.strokecolor1    = this.strokecolor;
        this.strokecolor2    = objtypeview.getStrokecolor2();
        this.strokewidth     = objtypeview.getStrokewidth();
        this.textcolor       = objtypeview.getTextcolor();
        this.textcolor2      = objtypeview.getTextcolor2();
        this.textscale       = objtypeview.getTextscale();
        this.memberscale     = objtypeview.getMemberscale();
        this.icon            = objtypeview.getIcon();
        this.image           = objtypeview.getImage();
        this.grabIsAllowed   = objtypeview.grabIsAllowed;
        this.markedAsDeleted = objtypeview.markedAsDeleted;
        this.modified        = objtypeview.modified;
        if (objtypeview.description)
            this.description = objtypeview.description;
    }
}
export class jsnObjectTypegeo {
    id:              string;
    name:            string;
    description:     string;
    typeRef:         string;
    metamodelRef:    string;
    loc:             string;
    size:            string;
    markedAsDeleted: boolean;
    modified:        boolean;
    constructor(objtypegeo: akm.cxObjtypeGeo) {
        this.id              = objtypegeo.id;
        this.name            = objtypegeo.name;
        this.typeRef         = (objtypegeo.type) ? objtypegeo.type.id : "";
        this.metamodelRef    = (objtypegeo.metamodel) ? objtypegeo.metamodel.id : "";
        this.loc             = objtypegeo.getLoc();
        this.size            = objtypegeo.getSize();
        this.description     = (objtypegeo.description) ? objtypegeo.description : "";
        this.markedAsDeleted = objtypegeo.markedAsDeleted;
        this.modified        = objtypegeo.modified;
    }
}

// Backward-compatible alias for older call sites that use PascalCase Geo.
export class jsnObjectTypeGeo extends jsnObjectTypegeo {}
export class jsnRelshipTypeView {
    id:              string;
    name:            string;
    description:     string;
    typeRef:         string;
    template:        string;
    strokecolor:     string;
    strokecolor1:    string;
    strokewidth:     number;
    textcolor:       string;
    textscale:       number;
    dash:            string;
    fromArrow:       string;
    toArrow:         string;
    fromArrowColor:  string;
    toArrowColor:    string;
    routing:         number;
    corner:          number;
    curve:           number;
    markedAsDeleted: boolean;
    modified:        boolean;
    constructor(reltypeview: akm.cxRelationshipTypeView) {
        this.id              = reltypeview.id;
        this.name            = reltypeview.name;
        this.description     = (reltypeview.description) ? reltypeview.description : "";
        this.typeRef         = reltypeview.getTypeRef();
        this.template        = reltypeview.getTemplate();
        this.strokecolor     = reltypeview.getStrokecolor();
        this.strokecolor1    = this.strokecolor1;
        this.strokewidth     = reltypeview.getStrokewidth();
        this.textcolor       = reltypeview.getTextcolor();
        this.textscale       = reltypeview.getTextscale();
        this.dash            = reltypeview.getDash();
        this.fromArrow       = reltypeview.getFromArrow();
        this.toArrow         = reltypeview.getToArrow();
        this.fromArrowColor  = reltypeview.getFromArrowColor();
        this.toArrowColor    = reltypeview.getToArrowColor();
        this.routing         = reltypeview.getRouting();
        this.corner          = reltypeview.getCorner();
        this.curve           = reltypeview.getCurve();
        this.markedAsDeleted = reltypeview.markedAsDeleted;
        this.modified        = reltypeview.modified;
    }
}
export class jsnProperty {
    id:                 string;
    name:               string;
    description:        string;
    datatypeRef:        string;
    methodRef:          string;
    unitCategoryRef:    string;
    defaultValue:       string;
    inputPattern:       string;
    viewFormat:         string;
    readOnly:           boolean;
    example:            string;
    markedAsDeleted:    boolean;
    modified:           boolean;
    constructor(prop: akm.cxProperty) {
        this.id              = prop.id;
        this.name            = prop.name;
        this.defaultValue    = "";
        this.inputPattern    = "";
        this.viewFormat      = "";
        this.example         = "";
        this.readOnly        = prop.readOnly;
        this.markedAsDeleted = prop.markedAsDeleted;
        this.modified        = prop.modified;
        // Code
        this.description = (prop.description) ? prop.description : "";
        if (prop.datatype)
            this.datatypeRef = prop.datatype.id;
        else 
            this.datatypeRef = prop.datatypeRef;
        if (prop.method)
            this.methodRef = prop.method.id;
        else 
            this.methodRef = prop.methodRef;
        if (prop.unitCategory)
            this.unitCategoryRef = prop.unitCategory.id;
        else 
            this.unitCategoryRef = prop.unitCategoryRef;
        if (prop.unitCategory)
            this.unitCategoryRef = prop.unitCategory.id;
        else 
            this.unitCategoryRef = prop.unitCategoryRef;
        if (prop.defaultValue)
            this.description = prop.defaultValue;
        if (debug) console.log('612 this', this);
    }
}
export class jsnAttribute {
    name:       string;
    typeName:   string;
    propName:   string;
    propRef:    string;     // Property id
    constructor(attr: akm.cxAttribute) {
        this.typeName = attr.typeName;
        this.propName = attr.propName;
        this.name     = attr.name;
        this.propRef  = attr.propRef;
    }
}
export class jsnMethodType {
    id:                 string;
    name:               string;
    description:        string;
    properties:         jsnProperty[];
    markedAsDeleted:    boolean;
    modified:           boolean;
    constructor(mtd: akm.cxMethodType) {
        this.id              = mtd.id;
        this.name            = mtd.name;
        this.description     = (mtd.description) ? mtd.description : "";
        this.properties      = mtd.properties;
        this.markedAsDeleted = mtd.markedAsDeleted;
        this.modified        = mtd.modified;
    }
}
export class jsnMethod {
    id:                 string;
    name:               string;
    description:        string;
    methodtype:         string;
    expression:         string;
    markedAsDeleted:    boolean;
    modified:           boolean;
    constructor(mtd: akm.cxMethod) {
        this.id              = mtd.id;
        this.name            = mtd.name;
        this.methodtype      = (mtd.methodtype) ? mtd.methodtype : "";
        this.expression      = mtd.expression;
        this.description     = (mtd.description) ? mtd.description : "";
        this.markedAsDeleted = mtd.markedAsDeleted;
        this.modified        = mtd.modified;
    }
}
export class jsnModel {
    id:                     string;
    name:                   string;
    description:            string;
    metamodelRef:           string;
    sourceMetamodelRef:     string;
    targetMetamodelRef:     string;
    sourceModelRef:         string;
    targetModelRef:         string;
    isTemplate:             boolean;
    includeSystemtypes:     boolean;
    includeRelshipkind:     boolean;
    templates:              jsnModelView[];
    objects:                jsnObject[];
    relships:               jsnRelationship[];
    modelviews:             jsnModelView[];
    markedAsDeleted:        boolean;
    modified:               boolean;
    args1:                  any[];
    args2:                  any[];
    constructor(model: akm.cxModel, includeViews: boolean) {
        this.id              = model.id;
        this.name            = model.name;
        this.description     = model.description ? model.description : "";
        this.metamodelRef       = model.metamodel?.id;
        this.sourceMetamodelRef = model.sourceMetamodelRef;
        this.targetMetamodelRef = model.targetMetamodelRef;
        this.sourceModelRef     = model.sourceModelRef;
        this.targetModelRef     = model.targetModelRef;
        this.includeSystemtypes = model.includeSystemtypes;
        this.includeRelshipkind = model.includeRelshipkind;
        this.isTemplate      = model.isTemplate;
        this.templates       = [];
        this.objects         = [];
        this.relships        = [];
        this.modelviews      = [];
        this.markedAsDeleted = model.markedAsDeleted;
        this.modified        = model.modified;
        this.args1           = model.args1;
        this.args2           = model.args2;
        // Code
        if (model.description)
            this.description = model.description;
        // Handle the objects
        const objects = model.getObjects();
        if (objects) {
            const cnt = objects.length;
            for (let i = 0; i < cnt; i++) {
                const object = objects[i];
                if (object && object.type)
                    this.addObject(object);
            }
        }
        // Handle the relationships
        const relships = model.getRelationships();
        if (relships) {
            const cnt = relships.length;
            for (let i = 0; i < cnt; i++) {
                const relship = relships[i];
                if (relship && relship.type)
                    this.addRelationship(relship);
            }
        }
        const templates = model.getTemplates();
        if (templates) {
            const cnt = templates.length;
            for (let i = 0; i < cnt; i++) {
                const tmpl = templates[i];
                if (tmpl)
                    this.addTemplate(tmpl);
            }
        }
        if (includeViews) {
            // Then handle the modelviews
            const modelviews = model.getModelViews();
            if (modelviews) {
                const cnt = modelviews.length;
                for (let j = 0; j < cnt; j++) {
                    const modelview = modelviews[j];
                    this.addModelView(modelview);
                }
            }
        }
    }
    addModelView(mv: akm.cxModelView) {
        if (debug) console.log('569 addModelView', mv);
        if (mv && !mv.isDeleted()) {
            const gModelView = new jsnModelView(mv);
            this.modelviews.push(gModelView);
            if (debug) console.log('572 addModelView', this.modelviews);
            // Then handle the objectviews
            const objtypeviews = mv?.objecttypeviews;
            if (objtypeviews) {
                const cnt = objtypeviews.length;
                for (let j = 0; j < cnt; j++) {
                    const objtypeview = objtypeviews[j];
                    gModelView.addObjectTypeView(objtypeview);
                }
            }
            // And then handle the relshipviews
            const reltypeviews = mv?.relshiptypeviews;
            if (reltypeviews) {
                const cnt = reltypeviews.length;
                for (let j = 0; j < cnt; j++) {
                    const reltypeview = reltypeviews[j];
                    gModelView.addRelshipTypeView(reltypeview);
                }
            }
            if (gModelView.objectviews.length == 0) {
                // Then handle the objectviews
                const objectviews = mv?.getObjectViews();
                if (objectviews) {
                    const cnt = objectviews.length;
                    for (let j = 0; j < cnt; j++) {
                        const objectview = objectviews[j];
                        gModelView.addObjectView(objectview);
                    }
                }
            }
            if (gModelView.relshipviews.length == 0) {
                // And then handle the relshipviews
                const relshipviews = mv?.getRelationshipViews();
                if (relshipviews) {
                    const cnt = relshipviews.length;
                    for (let j = 0; j < cnt; j++) {
                        const relshipview = relshipviews[j];
                        gModelView.addRelshipView(relshipview);
                    }
                }
            }
            if (debug) console.log('613 addModelView', gModelView);
        }
    }
    addObject(obj: akm.cxObject) {
        if (obj && obj.type) {
                const gObject = new jsnObject(obj);
            this.objects.push(gObject);
        }
    }
    addRelationship(rel: akm.cxRelationship) {
        if (rel && rel.type && rel.fromObject && rel.toObject) {
            const gRelship = new jsnRelationship(rel);
            this.relships.push(gRelship);
        }
    }
    addTemplate(tmpl: akm.cxModelView) {
        if (tmpl) {
            const gModelView = new jsnModelView(tmpl);
            this.templates.push(gModelView);
        }
    }
}
export class jsnExportModel {
    models: jsnModel[];
    constructor(includeViews: boolean) {
        this.models = [];
    }
    addModel(model: akm.cxModel, includeViews: boolean) {
        if (model) {
            const model = new jsnModel(model, includeViews);
            this.models.push(model);
        }
    }
}
export class jsnPort {
    id:          string;
    name:        string;
    description: string;
    side:        string;
    color:       string;
    constructor(port: akm.cxPort) {
        this.id      = port.id;
        this.name    = port.name;
        this.side    = port.side;
        this.color   = port.color;
        this.description = port.description;
    }
}
export class jsnObject {
    id:              string;
    name:            string;
    description:     string;
    text:            string;
    abstract:        boolean;
    viewkind:        string;
    typeRef:         string;
    parentModelRef:  string;
    typeName:        string;
    typeDescription: string;
    propertyValues:  any[];
    ports:           jsnPort[] | null;
    markedAsDeleted: boolean;
    generatedTypeId: string;
    modified:        boolean;
    constructor(object: akm.cxObject) {
        this.id              = object.id;
        this.name            = object.name;
        this.description     = object.description ? object.description : "";
        this.abstract        = object.abstract;
        this.viewkind        = object.viewkind;
        this.parentModelRef  = object.parentModelRef;
        this.typeRef         = object.type ? object.type.id : "";
        this.typeName        = object.type ? object.type.name : "";
        this.typeDescription = object.type ? object.type.description : "";
        this.propertyValues  = [];
        this.ports           = [];
        this.markedAsDeleted = object.markedAsDeleted;
        this.generatedTypeId = object.generatedTypeId;
        this.modified        = object.modified;

        // Code
        if (debug) console.log('876 this, object', this, object);

        for (let k in object) {
            switch (k) {
                case 'id':
                case 'name':
                case 'description':
                case 'abstract':
                case 'viewkind':
                case 'allProperties':
                case 'fromObject':
                case 'parentModel':
                case 'propertyValues':
                case 'toObject':
                case 'type':
                case 'typeview':
                case 'typeName':
                case 'typeRef':
                // case 'generatedTypeId':
                case 'markedAsDeleted':
                case 'modified':
                case 'inputrels':
                case 'outputrels':
                case 'objectviews':
                case 'ports':
                    continue;
                break;
            }
            this[k] = object[k];
        }

        const properties = object.allProperties;
        if (debug) console.log('879 object, properties', object, properties);
        if (properties) {
            for (let i=0; i<properties?.length; i++) {
                const prop = properties[i];
                if (!prop) continue;
                const propname = prop.name;
                const value = object.getStringValue2(propname);
                if (debug) console.log('885 propname, value', propname, value);
                this[propname] = value;                      
            }
        }
        if (debug) console.log('888 this', this);

        // Handle ports
        const ports = object.ports;
        if (ports) {
            this.ports = [];
            for (let i=0; i<ports.length; i++) {
                const port = ports[i];
                const gPort = new jsnPort(port);
                this.ports.push(gPort);
            }
        }

    // Handle property values    }
    // addPropertyValue(val: akm.cxPropertyValue) {
    //     if (!val)
    //         return;
    //     const gPropval = new jsnPropertyValue(val);
    //     if (!this.propertyValues)
    //         this.propertyValues = new Array();
    //     const len = this.propertyValues.length;
    //     for (let i=0; i<len; i++) {
    //         const pval = this.propertyValues[i];
    //         if (pval.id === val.id) {
    //             // Relationship is already in list
    //             return;
    //         }
    //     }
    //     this.propertyValues.push(gPropval);
    // }
    }
}
/*
export class jsnExportTypeDefinition {
	objecttypes:		jsnTypeDefinition[];
    constructor() {
        this.objecttypes = [];
    }
    addTypeDefinition(typedef: any) {
        if (utils.objExists(typedef)) {
            const gTypeDefinition = new jsnTypeDefinition(typedef);
            this.objecttypes.push(gTypeDefinition);
        }
    }
}
export class jsnTypeDefinition {
	id:					string;
	name:				string;
	description:		string;
	properties:			jsnPropertyDefinition[];

    constructor(typedef: akm.cxInstance) {
        this.id    = typedef.id;
        this.name  = typedef.name;
        this.description = (typedef.description) ? typedef.description : "";
        this.properties = new Array();
        // Code
        // let typeRef     = object.getType().id;
        const proptypes   = new Array();
        const rels: akm.cxRelationship[] = typedef.getOutputRelships(glb.myModel, undefined);
        if (utils.isArrayEmpty(rels)) {
            return;
        } else {
            for (let i=0; i < rels.length; i++) {
                const rel = rels[i];
                if (rel.getName() === "hasProperty") {
                    const proptype = rel.getToObject();
                    proptypes.push(proptype);
                }
            }
        }
        if (proptypes.length > 0) {
            // The current object is an object type definition
            // Load properties
            for (let j=0; j<proptypes.length; j++) {
                const proptype = proptypes[j];
                const prop     = new jsnPropertyDefinition(proptype);
                if (utils.objExists(prop)) {
                    this.properties.push(prop);
                }
            }
       }
    }
}
export class jsnPropertyDefinition {
	id:					string;
	name:				string;
	description:		string;
	datatype:			string;
	datatypeRef:		string;
    constructor(proptype: any) {
        this.id          = proptype.id;
        this.name        = proptype.name;
        this.description = (proptype.description) ? proptype.description : "";
        this.datatype    = "";
        this.datatypeRef = "";
        // Then find datatype if it exists
        const rels = proptype.getOutputRelships(glb.myModel);
        if (utils.isArrayEmpty(rels)) {
            return;
        } else {
            for (let i=0; i < rels.length; i++) {
                const rel = rels[i];
                if (rel.getName() === "isOfDatatype") {
                    const proptype = rel.getToObject();
                    this.datatype = proptype.getName();
                    const dtype = jsnMetis.findDatatypeByName(this.datatype);
                    if (utils.objExists(dtype))
                        this.datatypeRef = dtype.id;
                }
            }
        }
    }
}
*/
export class jsnRelationship {
    id:              string;
    name:            string;
    description:     string;
    relshipkind:     string;
    typeRef:         string;
    fromobjectRef:   string;
    toobjectRef:     string;
    propvalues:      any[];
    cardinality:     string;
    cardinalityFrom: string;
    cardinalityTo:   string;
    nameFrom:        string;
    nameTo:          string;
    fromPortid:      string;
    toPortid:        string;
    markedAsDeleted: boolean;
    generatedTypeId: string;
    modified:        boolean;
    constructor(relship: akm.cxRelationship) {
        this.id              = relship.id;
        this.name            = relship.name;
        this.description     = relship.description;
        this.relshipkind     = relship.relshipkind;
        this.fromobjectRef   = relship.fromObject ? relship.fromObject.id : "";
        this.toobjectRef     = relship.toObject ? relship.toObject.id : "";
        this.typeRef         = relship.type ? relship.type.id : "";
        this.propvalues      = [];
        this.cardinality     = relship.cardinality;
        this.cardinalityFrom = relship.cardinalityFrom;
        this.cardinalityTo   = relship.cardinalityTo;
        this.nameFrom        = relship.nameFrom;
        this.nameTo          = relship.nameTo;
        this.fromPortid      = relship.fromPortid;
        this.toPortid        = relship.toPortid;
        this.markedAsDeleted = relship.markedAsDeleted;
        this.generatedTypeId = relship.generatedTypeId;
        this.modified        = relship.modified;
        // Code
        const properties = relship.allProperties;
        if (debug) console.log('879 relship, properties', relship, properties);
        for (let i=0; i<properties?.length; i++) {
          const prop = properties[i];
          if (!prop) continue;
          const propname = prop.name;
          const value = relship.getStringValue2(propname);
          if (debug) console.log('885 propname, value', propname, value);
          this[propname] = value;                      
        }
    }
    addPropertyValue(val: akm.cxPropertyValue) {
        if (utils.objExists(val)) {
            const gPropval = new jsnPropertyValue(val);
            this.propvalues.push(gPropval);
        }
    }
}

export class jsnPropertyValue {
    property:   jsnProperty;
    value:      string;
    constructor(propval: jsnPropertyValue) {
        this.property   = propval.property;
        this.value      = propval.value;
    }
}

export class jsnPropertyGroup {
    id:     string;
    name:   string;
    description: string;
    propertyValues: jsnPropertyValue[];
    constructor(id: string, name: string, description: string) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.propertyValues = new Array();
    }
    addPropertyValue(propval: jsnPropertyValue) {
        this.propertyValues.push(propval);
    }
    getPropertyValues(): jsnPropertyValue[] {
        return this.propertyValues;
    }
    findPropertyValue(propname: string): jsnPropertyValue | null {
        for (let i = 0; i < this.propertyValues.length; i++) {
            const propval = this.propertyValues[i];
            if (propval.property.name === propname)
                return propval;
        }
        return null;
    }
}

export class jsnModelView {
    id:                 string;
    name:               string;
    description:        string;
    layout:             string;
    routing:            string;
    linkcurve:          string;
    showCardinality:    boolean;
    showRelshipNames:   boolean;
    askForRelshipName:  boolean;
    includeInheritedReltypes: boolean | null;
    UseUMLrelshipkinds: boolean;
    modelRef:           string;
    viewstyleRef:       string;
    objectviews:        jsnObjectView[];
    relshipviews:       jsnRelshipView[];
    objecttypeviews:    jsnObjectTypeView[];
    relshiptypeviews:   jsnRelshipTypeView[];
    focusObjectviewRef: string;
    markedAsDeleted:    boolean;
    modified:           boolean;
    constructor(mv: akm.cxModelView) {
        this.id                 = mv?.id;
        this.name               = mv?.getName();
        this.description        = mv?.description;
        this.layout             = mv?.layout;
        this.routing            = mv?.routing;
        this.linkcurve          = mv?.linkcurve;
        this.modelRef           = mv?.getModel()?.id;
        this.showCardinality    = mv?.showCardinality;
        this.showRelshipNames   = mv?.showRelshipNames;
        this.askForRelshipName  = mv?.askForRelshipName;
        this.includeInheritedReltypes = mv?.includeInheritedReltypes;
        this.UseUMLrelshipkinds = mv?.getModel()?.includeRelshipkind;
        this.viewstyleRef       = mv?.getViewStyle()?.getId();
        this.objectviews        = [];
        this.relshipviews       = [];
        this.objecttypeviews    = [];
        this.relshiptypeviews   = [];
        this.focusObjectviewRef = mv?.focusObjectview?.id;
        this.markedAsDeleted    = mv?.markedAsDeleted;
        this.modified           = mv?.modified;

        // Code
        this.viewstyleRef = mv?.getViewStyle()?.getId();
        const objviews = mv?.getObjectViews();
        if (objviews) {
            const cnt = objviews.length;
            for (let i = 0; i < cnt; i++) {
                const objview = objviews[i];
                this.addObjectView(objview);
            }
        }
        const relviews = mv?.getRelationshipViews();
        if (relviews) {
            const cnt = relviews.length;
            for (let i = 0; i < cnt; i++) {
                const relview = relviews[i];
                this.addRelshipView(relview);
            }
        }
        // Then handle the objecttypeviews
        const objtypeviews = mv?.objecttypeviews;
        if (objtypeviews) {
            const cnt = objtypeviews.length;
            for (let j = 0; j < cnt; j++) {
                const objtypeview = objtypeviews[j];
                this.addObjectTypeView(objtypeview);
            }
        }
        // And then handle the relshiptypeviews
        const reltypeviews = mv?.relshiptypeviews;
        if (reltypeviews) {
            const cnt = reltypeviews.length;
            for (let j = 0; j < cnt; j++) {
                const reltypeview = reltypeviews[j];
                this.addRelshipTypeView(reltypeview);
            }
        }
    }
    addObjectView(objview: akm.cxObjectView) {
        if (objview) {
            const gObjectView = new jsnObjectView(objview);
            this.objectviews.push(gObjectView);
        }
    }
    addRelshipView(relview: akm.cxRelationshipView) {
        if (relview && relview.relship && relview.fromObjview && relview.toObjview) {
            const gRelshipView = new jsnRelshipView(relview);
            this.relshipviews.push(gRelshipView);
        }
    }
    addObjectTypeView(objtypeview: akm.cxObjectTypeView) {
        if (objtypeview) {
            const gObjectTypeView = new jsnObjectTypeView(objtypeview);
            this.objecttypeviews.push(gObjectTypeView);
        }
    }
    addRelshipTypeView(reltypeview: akm.cxRelationshipTypeView) {
        if (reltypeview) {
            const gRelshipTypeView = new jsnRelshipTypeView(reltypeview);
            this.relshiptypeviews.push(gRelshipTypeView);
        }
    }
}
export class jsnObjectView {
    id:              string;
    name:            string;
    description?:    string;
    text?:           string;
    objectRef:       string;
    typeviewRef:     string;
    group:           string;
    isGroup:         boolean;
    groupLayout:     string;
    grabIsAllowed:   boolean;
    isExpanded:      boolean;
    isSelected:      boolean;
    loc:             string;
    layoutRevision?: string;
    size?:           string;
    scale?:          number;
    memberscale?:    number;
    arrowscale?:     string;
    viewkind:        string;
    markedAsDeleted: boolean;
    modified:        boolean;
    template?:       string;
    template2?:      string;
    figure?:         string;
    geometry?:       string;
    fillcolor?:      string;
    fillcolor2?:     string;
    strokecolor?:    string;
    strokecolor2?:   string;
    strokewidth?:    number;
    textcolor?:      string;
    textcolor2?:     string;
    textscale?:      number;
    icon?:           string;
    iconpath?:       string;
    icon1?:          string;
    icon2?:          string;
    icon3?:          string;
    image?:          string;
    modelviewId?:    string;
    constructor(objview: akm.cxObjectView) {
        // Always store core attributes
        this.id              = objview?.id;
        this.name            = objview?.name;
        this.objectRef       = objview?.object?.id;
        if (!this.objectRef) 
            this.objectRef   = objview?.objectRef;
        this.typeviewRef     = objview?.typeview?.id;
        this.group           = objview?.group;
        this.groupLayout     = objview?.groupLayout;
        this.grabIsAllowed   = objview?.grabIsAllowed;
        this.viewkind        = objview?.viewkind;
        this.isGroup         = objview?.isGroup;
        this.isExpanded      = objview?.isExpanded;
        this.isSelected      = objview?.isSelected;
        this.loc             = objview?.loc;
        if ((objview as any)?.layoutRevision) this.layoutRevision = String((objview as any).layoutRevision);
        this.markedAsDeleted = objview?.markedAsDeleted;
        this.modified        = objview?.modified;
        if ((objview as any)?.modelviewId) this.modelviewId = (objview as any).modelviewId;

        // Delta-only storage: only store visual attributes that differ from typeview
        const typeview = objview?.typeview;
        const shouldStore = (objviewVal: any, typeviewAttr: string) => {
            if (objviewVal === undefined || objviewVal === null || objviewVal === '') return false;
            if (!typeview) return true; // No typeview, store everything
            const typeviewVal = typeview[typeviewAttr];
            // Store if different from typeview or if typeview doesn't have this attribute
            return objviewVal !== typeviewVal;
        };

        // Apply delta-only logic for visual attributes
        if (shouldStore(objview?.description, 'description')) this.description = objview.description;
        if (shouldStore(objview?.template, 'template')) this.template = objview.template;
        if (shouldStore(objview?.template2, 'template2')) this.template2 = objview.template2;
        if (shouldStore(objview?.figure, 'figure')) this.figure = objview.figure;
        if (shouldStore(objview?.geometry, 'geometry')) this.geometry = objview.geometry;
        if (shouldStore(objview?.fillcolor, 'fillcolor')) this.fillcolor = objview.fillcolor;
        if (shouldStore(objview?.fillcolor2, 'fillcolor2')) this.fillcolor2 = objview.fillcolor2;
        if (shouldStore(objview?.strokecolor, 'strokecolor')) this.strokecolor = objview.strokecolor;
        if (shouldStore(objview?.strokecolor2, 'strokecolor2')) this.strokecolor2 = objview.strokecolor2;
        if (shouldStore(objview?.strokewidth, 'strokewidth')) this.strokewidth = objview.strokewidth;
        if (shouldStore(objview?.textcolor, 'textcolor')) this.textcolor = objview.textcolor;
        if (shouldStore(objview?.textcolor2, 'textcolor2')) this.textcolor2 = objview.textcolor2;
        if (shouldStore(objview?.textscale, 'textscale')) this.textscale = objview.textscale;
        if (shouldStore(objview?.icon, 'icon')) this.icon = objview.icon;
        if (shouldStore(objview?.iconpath, 'iconpath')) this.iconpath = objview.iconpath;
        if (shouldStore(objview?.icon1, 'icon1')) this.icon1 = objview.icon1;
        if (shouldStore(objview?.icon2, 'icon2')) this.icon2 = objview.icon2;
        if (shouldStore(objview?.icon3, 'icon3')) this.icon3 = objview.icon3;
        if (shouldStore(objview?.image, 'image')) this.image = objview.image;
        if (shouldStore(objview?.size, 'size')) this.size = objview.size;
        if (shouldStore(objview?.scale, 'scale')) this.scale = objview.scale;
        if (shouldStore(objview?.memberscale, 'memberscale')) this.memberscale = objview.memberscale;
        if (shouldStore(objview?.arrowscale, 'arrowscale')) this.arrowscale = objview.arrowscale;
    }
}
export class jsnRelshipView {
    id:              string;
    name:            string;
    description?:    string;
    relshipRef:      string;
    typeviewRef:     string;
    fromobjviewRef:  string;
    toobjviewRef:    string;
    fromPortid:      string;
    toPortid:        string;
    template?:       string;
    template2?:      string;
    arrowscale?:     number;
    strokecolor?:    string;
    strokewidth?:    number;
    textcolor?:      string;
    textscale?:      number;
    dash?:           string;
    fromArrow?:      string;
    toArrow?:        string;
    fromArrowColor?: string;
    toArrowColor?:   string;
    routing:         number;
    corner:          number;
    curve:           string;
    points:          any;
    markedAsDeleted: boolean;
    modified:        boolean;
    visible:         boolean;
    constructor(relview: akm.cxRelationshipView) {
        // Always store core attributes
        this.id              = relview?.id;
        this.name            = relview?.name;
        this.relshipRef      = relview?.relship?.id || "";
        this.typeviewRef     = relview?.typeview?.id || "";
        this.fromobjviewRef  = relview && relview.fromObjview ? relview.fromObjview.id : "";
        this.toobjviewRef    = relview && relview.toObjview ? relview.toObjview.id : "";
        this.fromPortid      = relview?.fromPortid;
        this.toPortid        = relview?.toPortid;
        this.points          = relview?.points;
        this.routing         = relview?.routing;
        this.curve           = relview?.curve;
        this.corner          = relview?.corner;
        this.markedAsDeleted = relview?.markedAsDeleted;
        this.modified        = relview?.modified;
        this.visible         = relview?.visible;

        // Delta-only storage: only store visual attributes that differ from typeview
        const typeview = relview?.typeview;
        const shouldStore = (relviewVal: any, typeviewAttr: string) => {
            if (relviewVal === undefined || relviewVal === null || relviewVal === '') return false;
            if (!typeview) return true; // No typeview, store everything
            const typeviewVal = typeview[typeviewAttr];
            // Store if different from typeview or if typeview doesn't have this attribute
            return relviewVal !== typeviewVal;
        };

        // Apply delta-only logic for visual attributes
        if (relview?.description) this.description = relview.description;
        if (shouldStore(relview?.template, 'template')) this.template = relview.template;
        if (shouldStore(relview?.template2, 'template2')) this.template2 = relview.template2;
        if (shouldStore(relview?.arrowscale, 'arrowscale')) this.arrowscale = relview.arrowscale;
        if (shouldStore(relview?.strokecolor, 'strokecolor')) this.strokecolor = relview.strokecolor;
        if (shouldStore(relview?.strokewidth, 'strokewidth')) this.strokewidth = relview.strokewidth;
        if (shouldStore(relview?.textcolor, 'textcolor')) this.textcolor = relview.textcolor;
        if (shouldStore(relview?.textscale, 'textscale')) this.textscale = relview.textscale;
        if (shouldStore(relview?.dash, 'dash')) this.dash = relview.dash;
        if (shouldStore(relview?.fromArrow, 'fromArrow')) this.fromArrow = relview.fromArrow;
        if (shouldStore(relview?.toArrow, 'toArrow')) this.toArrow = relview.toArrow;
        if (shouldStore(relview?.fromArrowColor, 'fromArrowColor')) this.fromArrowColor = relview.fromArrowColor;
        if (shouldStore(relview?.toArrowColor, 'toArrowColor')) this.toArrowColor = relview.toArrowColor;
    }
}
export class jsnImportMetis {
    name:                       string;
    description:                string;
    metamodels:                 akm.cxMetaModel[];
    models:                     akm.cxModel[];
    currentMetamodelRef:        string;
    currentModelRef:            string;
    currentModelviewRef:        string;
    currentTemplateModelRef:    string;
    pasteViewsOnly:             boolean;
    deleteViewsOnly:            boolean;
    imported:                   any;
    constructor(metis: akm.cxMetis, importedData: any) {
        this.name                   = importedData.name;
        this.description            = importedData.description;
        this.metamodels             = [];
        this.models                 = [];
        this.imported               = importedData;
        this.pasteViewsOnly         = importedData.pasteViewsOnly;
        this.deleteViewsOnly        = importedData.deleteViewsOnly;
        this.currentMetamodelRef    = importedData.currentMetamodelRef;
        this.currentModelRef        = importedData.currentModelRef;
        this.currentModelviewRef    = importedData.currentModelviewRef;
        this.currentTemplateModelRef = importedData.currentTemplateModelRef;

        jsnMetis = metis;

        // Handle metamodels
        const metamodels = importedData.metamodels;
        if (metamodels && (metamodels.length > 0)) {
            metamodels.forEach(function (this: jsnImportMetis, metamodel: akm.cxMetaModel) {
                if (debug) console.log('834 importMetamodel', metamodel);
                this?.importMetamodel(metamodel);
            });
        }
        // Handle models 
        const models = importedData.models;
        if (models && (models.length > 0)) {
            models.forEach(function (this: jsnImportMetis, model: akm.cxModel) {
                this?.importModel(model);
            });
        }
    }
    importMetamodel(item: akm.cxMetaModel) {
        if (debug) console.log('1001 importMetis - jsnMetis', jsnMetis);
        let metamodel = jsnMetis.findMetamodel(item.id);
        if (!metamodel) {
            metamodel = new akm.cxMetaModel(item.id, item.name, item.description);
            jsnMetis.addMetamodel(metamodel);
        }
        if (debug) console.log("851 Imported metamodel: " + item.id + ", " + item.name);
        let datatypes = item.datatypes;
        if (datatypes && datatypes.length) {
            datatypes.forEach(dt => {
                let dtype = dt as akm.cxDatatype;
                this.importDatatype(dtype, metamodel);
            });
        }
        let properties = item.properties;
        if (properties && properties.length) {
            properties.forEach(p => {
                let prop = p as akm.cxProperty;
                this.importProperty(prop, metamodel);
            });
        }
        let methods = item.methods;
        if (methods && methods.length) {
            methods.forEach(m => {
                let mtd = m as akm.cxMethod;
                this.importMethod(mtd, metamodel);
            });
        }
        let objecttypes = item.objecttypes;
        if (objecttypes && objecttypes.length) {
            objecttypes.forEach(ot => {
                let objtype = ot as akm.cxObjectType;
                this.importObjectType(objtype, metamodel);
            });
        }
        let objtypegeos = item.objtypegeos;
        if (objtypegeos && objtypegeos.length) {
            objtypegeos.forEach(geo => {
                let objtypegeo = geo as akm.cxObjtypeGeo;
                this.importObjectTypegeo(objtypegeo, metamodel);
            });
        }
        let objecttypeviews = item.objecttypeviews;
        if (objecttypeviews && objecttypeviews.length) {
            objecttypeviews.forEach(otv => {
                let objtypeview = otv as akm.cxObjectTypeView;
                this.importObjectTypeView(objtypeview, metamodel);
            });
        }
        objecttypes = item.objecttypes;
        if (objecttypes && objecttypes.length) {
            objecttypes.forEach(ot => {
                let objtype = ot as akm.cxObjectType;
                this.importObjectType(objtype, metamodel);
            });
        }
        objtypegeos = item.objtypegeos;
        if (objtypegeos && objtypegeos.length) {
            objtypegeos.forEach(geo => {
                let objtypegeo = geo as akm.cxObjtypeGeo;
                this.importObjectTypegeo(objtypegeo, metamodel);
            });
        }
        objecttypeviews = item.objecttypeviews;
        if (objecttypeviews && objecttypeviews.length) {
            objecttypeviews.forEach(otv => {
                let objtypeview = otv as akm.cxObjectTypeView;
                this.importObjectTypeView(objtypeview, metamodel);
            });
        }

        let relshiptypes = item.relshiptypes;
        if (relshiptypes && relshiptypes.length) {
            relshiptypes.forEach(rt => {
                let reltype = rt as akm.cxRelationshipType;
                this.importRelshipType(reltype, metamodel);
            });
        }
        metamodel.relshiptypes0 = [];
        const relshiptypes0 = item.relshiptypes0;
        if (relshiptypes0 && relshiptypes0.length) {
            relshiptypes0.forEach(rt => {
                const reltype = jsnMetis.findRelationshipType(rt?.id) || metamodel.findRelationshipType(rt?.id);
                if (reltype) metamodel.addRelationshipType0(reltype);
            });
        }
        let relshiptypeviews = item.relshiptypeviews;
        if (relshiptypeviews && relshiptypeviews.length) {
            relshiptypeviews.forEach(rtv => {
                let reltypeview = rtv as akm.cxRelationshipTypeView;
                this.importRelshipTypeView(reltypeview, metamodel);
            });
        }
        // relshiptypes = item.relshiptypes;
        // if (relshiptypes && relshiptypes.length) {
        //     relshiptypes.forEach(rt => {
        //         let reltype = rt as akm.cxRelationshipType;
        //         this.importRelshipType(reltype, metamodel);
        //     });
        // }
        // relshiptypeviews = item.relshiptypeviews;
        // if (relshiptypeviews && relshiptypeviews.length) {
        //     relshiptypeviews.forEach(rtv => {
        //         let reltypeview = rtv as akm.cxRelationshipTypeView;
        //         this.importRelshipTypeView(reltypeview, metamodel);
        //     });
        // }

    }
    importObjectType(item: any, metamodel: akm.cxMetaModel) {
        if (debug) console.log('1096 importObjectType - jsnMetis', jsnMetis);
        let objtype = metamodel.findObjectType(item.id);
        if (!utils.objExists(objtype)) {
            objtype = new akm.cxObjectType(item.id, item.name, item.description);
        } else {
            let otype = (objtype as any);
            for (const prop in item) {
                if (utils.objExists(item[prop])) {
                    otype[prop] = item[prop];
                }
            }
        }
        if (utils.objExists(item.typeviewRef)) {
            const objtypeview = jsnMetis.findObjectTypeView(item.typeviewRef);
            if (objtype && objtypeview)
                objtype.setDefaultTypeView(objtypeview);
        }
        jsnMetis.addObjectType(objtype);
        if (objtype) metamodel.addObjectType(objtype);
        if (debug) console.log("Importing objecttype: " + item.id + ", " + item.name);
    }
    importRelshipType(item: any, metamodel: akm.cxMetaModel) {
        let reltype = metamodel.findRelationshipType(item.id);
        let fromobjtype = metamodel.findObjectType(item.fromobjtypeRef);
        let toobjtype = metamodel.findObjectType(item.toobjtypeRef);
        if (reltype && fromobjtype && toobjtype) {
            reltype = new akm.cxRelationshipType(item.id, item.name, fromobjtype, toobjtype, item.description);
        } else {
            let rtype = (reltype as any);
            for (const prop in rtype) {
                if (utils.objExists(item[prop]))
                    rtype[prop] = item[prop];
            }
        }
        if (utils.objExists(item.fromobjtypeRef) && utils.objExists(item.toobjtypeRef)) {
            const fromobjType = jsnMetis.findObjectType(item.fromobjtypeRef);
            const toobjType = jsnMetis.findObjectType(item.toobjtypeRef);
            if (reltype) reltype.setFromObjtype(fromobjType);
            if (reltype) reltype.setToObjtype(toobjType);
        }
        if (utils.objExists(item.typeviewRef)) {
            const reltypeview = jsnMetis.findRelationshipTypeView(item.typeviewRef);
            if (reltype && reltypeview)
                reltype.setDefaultTypeView(reltypeview);
        }
        jsnMetis.addRelationshipType(reltype);
        if (reltype) metamodel.addRelationshipType(reltype);
        if (debug) console.log("1628 Importing reltype: " + item.id + ", " + item.name);
        const properties = item.properties;
        if (utils.objExists(properties) && (properties.length > 0)) {
            properties.forEach(function (this: jsnImportMetis, prop: akm.cxProperty) {
                this.importProperty(prop, metamodel);
            });
        }
    }
    importObjectTypeView(item: any, metamodel: akm.cxMetaModel) {
        const typeref = item.typeRef;
        const type = jsnMetis.findObjectType(typeref);
        const objtypeview = new akm.cxObjectTypeView(item.id, item.name, type, item.description);
        if (utils.objExists(type))
            objtypeview.setType(type);
        objtypeview.setTemplate(item.template);
        objtypeview.setFigure(item.figure);
        objtypeview.setFigure2(item.figure2);
        objtypeview.setGeometry(item.geometry);
        objtypeview.setFillcolor(item.fillcolor);
        objtypeview.setFillcolor2(item.fillcolor2);
        objtypeview.setStrokecolor(item.strokecolor);
        objtypeview.setStrokecolor2(item.strokecolor2);
        objtypeview.setStrokewidth(item.strokewidth);
        objtypeview.setTextcolor(item.textcolor);
        objtypeview.setTextcolor2(item.textcolor2);
        objtypeview.setStrokewidth(item.strokewidth);
        objtypeview.setIcon(item.icon);
        jsnMetis.addObjectTypeView(objtypeview);
        metamodel.addObjectTypeView(objtypeview);
        if (debug) console.log("Importing objtypeview: " + item.id + ", " + item.name);
    }
    importObjectTypegeo(item: any, metamodel: akm.cxMetaModel) {
        let typeref = item.typeRef;
        let type = jsnMetis.findObjectType(typeref);
        let objtypegeo = metamodel.findObjtypeGeo(item.id);
        if (!objtypegeo) {
            objtypegeo = new akm.cxObjtypeGeo(item.id, metamodel, type, "", "");
            if (objtypegeo) objtypegeo.setMetamodel(metamodel);
        }
        if (objtypegeo) {
            if (type)
                objtypegeo.setType(type);
            objtypegeo.setLoc(item.loc);
            objtypegeo.setSize(item.size);
            jsnMetis.addObjtypeGeo(objtypegeo);
            metamodel.addObjtypeGeo(objtypegeo);
        }
    }
    importRelshipTypeView(item: any, metamodel: akm.cxMetaModel) {
        const typeref = item.typeRef;
        const type = jsnMetis.findRelationshipType(typeref);
        if (!type) return;
        if (debug) console.log('1783 item', item);
        const reltypeview = new akm.cxRelationshipTypeView(item.id, item.name, type, item.description);
        reltypeview.setType(type);
        reltypeview.setTemplate(item.template);
        reltypeview.setTemplate2(item.template2);
        reltypeview.setStrokecolor(item.strokecolor);
        reltypeview.setStrokewidth(item.strokewidth);
        reltypeview.setDash(item.dash);
        reltypeview.setTextcolor(item.textcolor);
        reltypeview.setTextscale(item.textscale);
        reltypeview.setArrowscale(item.arrowscale);
        reltypeview.setFromArrow(item.fromarrow);
        reltypeview.setToArrow(item.toarrow);
        reltypeview.setFromArrowColor(item.fromArrowColor);
        reltypeview.setToArrowColor(item.toArrowColor);
        reltypeview.setRouting(item.routing);
        reltypeview.setCorner(item.corner);
        reltypeview.setCurve(item.curve);
        jsnMetis.addRelationshipTypeView(reltypeview);
        metamodel.addRelationshipTypeView(reltypeview);
        if (debug) console.log("1794 Importing reltypeview: " + item.id + ", " + item.name);
    }
    importProperty(item: any, metamodel: akm.cxMetaModel) {
        let property = metamodel.findProperty(item.id);
        if (!utils.objExists(property)) {
            property = new akm.cxProperty(item.id, item.name, item.description);
        }
        for (const prop in item) {
            if (utils.objExists(item[prop])) {
                let p = (property as any)
                p[prop] = item[prop];
            }
        }
        // Eventually add datatype and unit
        jsnMetis.addProperty(property);
        if (property) metamodel.addProperty(property);
        // type.addProperty(property);
    }
    importMethodType(item: any, metamodel: akm.cxMetaModel) {
        let mtype = metamodel.findMethodType(item.id);
        if (!mtype) {
            mtype = new akm.cxMethodType(item.id, item.name, item.description);
        }
        for (const prop in item) {
            if (utils.objExists(item[prop])) {
                let p = (mtype as any)
                p[prop] = item[prop];
            }
        }
        // Eventually add method type
        jsnMetis.addMethodType(mtype);
        if (mtype) metamodel.addMethodType(mtype);
    }
    importMethod(item: any, metamodel: akm.cxMetaModel) {
        let method = metamodel.findMethod(item.id);
        if (!method) {
            method = new akm.cxMethod(item.id, item.name, item.description);
        }
        for (const prop in item) {
            if (utils.objExists(item[prop])) {
                let p = (method as any)
                p[prop] = item[prop];
            }
        }
        // Eventually add mëthod
        jsnMetis.addMethod(method);
        if (method) metamodel.addMethod(method);
    }
    importDatatype(item: any, metamodel: akm.cxMetaModel) {
        if (debug) console.log('1317 importDatatype item:', item);
        let dtype = jsnMetis.findDatatype(item.id);
        if (!utils.objExists(dtype)) {
            dtype = new akm.cxDatatype(item.id, item.name, item.description);
        }
        // Eventually add datatype and unit
        jsnMetis.addDatatype(dtype);
        metamodel.addDatatype(dtype);
    }
    importModel(item: any) {
        const metamodel = jsnMetis.findMetamodel(item.metamodelRef);
        const model = new akm.cxModel(item.id, item.name, metamodel, item.description);
        model.setMetamodel(metamodel);
        jsnMetis.addModel(model);
        if (debug) console.log("Importing model: " + item.id + ", " + item.name);
        const objects = item.objects;
        if (objects && (objects.length > 0)) {
            objects.forEach(function (this: jsnImportMetis, obj: akm.cxObject) {
                this.importObject(obj, model);
            });
        }
        const relships = item.relships;
        if (relships && (relships.length > 0)) {
            relships.forEach(function (this: jsnImportMetis, rel: akm.cxRelationship) {
                this.importRelship(rel, model);
            });
        }
        const modelviews = item.modelviews;
        if (modelviews && (modelviews.length > 0)) {
            modelviews.forEach(function (this: jsnImportMetis, mv: akm.cxModelView) {
                this.importModelView(mv, model);
            });
        }
    }
    importObject(item: any, model: akm.cxModel) {
        if (item.typeRef) {
            let objtype = jsnMetis.findObjectType(item.typeRef);
            const metamodel = model.metamodel;
            if (!objtype) {
                objtype = metamodel.findObjectTypeByName(item.name);
                if (!objtype) {
                    objtype = metamodel.findObjectTypeByName('Generic');
                }
            }
            if (objtype) {
                const objectName = typeof item.name === 'string' && item.name.trim()
                    ? item.name
                    : objtype.name;
                let obj = new akm.cxObject(item.id, objectName, objtype, item.description);
                obj.setType(objtype);
                // EntityType presentation belongs to the semantic TYPE object.
                // Keep these source defaults on import so Generate Metamodel can
                // transfer them to the generated ObjectTypeView. ObjectView
                // values remain per-view overrides and are handled separately.
                ['fillcolor', 'strokecolor', 'strokewidth', 'icon'].forEach((property) => {
                    if (Object.prototype.hasOwnProperty.call(item, property) && item[property] !== undefined && item[property] !== null && item[property] !== '') {
                        obj[property] = item[property];
                    }
                });
                if (item.ports && item.ports.length) {
                    obj.ports = [];
                    item.ports.forEach((port: any) => {
                        const newPort = new akm.cxPort(port.id, port.name, port.description || "", port.side);
                        if (port.color) newPort.color = port.color;
                        obj.ports.push(newPort);
                    });
                }
                jsnMetis.addObject(obj);
                model.addObject(obj);
                if (debug) console.log("Importing object: " + item.id + ", " + item.name);
            }
        }
    }
    importRelship(item: any, model: akm.cxModel) {
        if (item.typeRef) {
            let reltype = jsnMetis.findRelationshipType(item.typeRef);
            const metamodel = model.metamodel;
            if (!reltype) {
                reltype = metamodel.findRelationshipTypeByName(item.typeName);
                if (!reltype) {
                    reltype = metamodel.findRelationshipTypeByName(item.name);
                }
                if (!reltype) {
                    reltype = metamodel.findRelationshipTypeByName(constants.types.AKM_GENERIC_REL);
                }
            }
            const fromObj = jsnMetis.findObject(item.fromObjectRef || item.fromobjectRef);
            const toObj = jsnMetis.findObject(item.toObjectRef || item.toobjectRef);
            if (reltype && fromObj && toObj) {
                const rel = new akm.cxRelationship(
                    item.id,
                    reltype,
                    fromObj,
                    toObj,
                    item.name,
                    item.description,
                    item.fromPortid || "",
                    item.toPortid || ""
                );
                rel.setType(reltype);
                jsnMetis.addRelationship(rel);
                model.addRelationship(rel);
                if (debug) console.log("Importing relship: " + item.id + ", " + item.name);
            }
        }
    }
    importModelView(item: akm.cxModelView, model: akm.cxModel) {
        const modelview = new akm.cxModelView(item.id, item.name, model, item.description);
        jsnMetis.addModelView(modelview);
        model.addModelView(modelview);
        if (debug) console.log("Importing modelview: " + item.id + ", " + item.name);
        const objectviews = item.objectviews;
        objectviews.forEach(function (this: jsnImportMetis, objview: akm.cxObjectView) {
            this.importObjectView(objview, modelview);
        });
        const relshipviews = item.relshipviews;
        relshipviews.forEach(function (this: jsnImportMetis, relview: akm.cxRelationshipView) {
            this.importRelshipView(relview, modelview);
        });
    }
    importObjectView(item: akm.cxObjectView, modelview: akm.cxModelView) {
        if (item.objectRef) {
            const object = jsnMetis.findObject(item.objectRef);
            if (object) {
                const objectviewName = typeof item.name === 'string' && item.name.trim()
                    ? item.name
                    : (typeof object.name === 'string' && object.name.trim()
                        ? object.name
                        : object.type?.name || '');
                const objview = new akm.cxObjectView(item.id, objectviewName, object, item.description, modelview);
                objview.group = item.group;
                objview.isGroup = item.isGroup;
                objview.groupLayout = item.groupLayout;
                objview.isExpanded = item.isExpanded;
                objview.isSelected = item.isSelected;
                objview.loc = item.loc;
                objview.layoutRevision = item.layoutRevision ?? "";
                objview.size = item.size;
                objview.scale = item.scale;
                objview.memberscale = item.memberscale;
                objview.arrowscale = item.arrowscale;
                objview.viewkind = item.viewkind;
                objview.markedAsDeleted = item.markedAsDeleted;
                objview.modified = item.modified;
                objview.template = item.template ?? "";
                objview.template2 = item.template2 ?? "";
                objview.figure = item.figure ?? "";
                objview.figure2 = item.figure2 ?? "";
                objview.geometry = item.geometry ?? "";
                objview.fillcolor = item.fillcolor ?? "";
                objview.fillcolor2 = item.fillcolor2 ?? "";
                objview.strokecolor = item.strokecolor ?? "";
                objview.strokecolor2 = item.strokecolor2 ?? "";
                objview.strokewidth = item.strokewidth;
                objview.textcolor = item.textcolor ?? "";
                objview.textcolor2 = item.textcolor2 ?? "";
                objview.textscale = item.textscale;
                objview.icon = item.icon ?? "";
                objview.iconpath = item.iconpath ?? "";
                objview.icon1 = item.icon1 ?? "";
                objview.icon2 = item.icon2 ?? "";
                objview.icon3 = item.icon3 ?? "";
                objview.image = item.image ?? "";
                objview.setObject(object);
                if (item.typeviewRef) {
                    const objtypeview = jsnMetis.findObjectTypeView(item.typeviewRef);
                    if (objtypeview)
                        objview.setTypeView(objtypeview);
                }
                // Object views are constructed with white/black runtime defaults.
                // When no explicit view override was persisted, let build/render fall back
                // to the typeview colors instead of keeping those constructor defaults.
                if (objview.typeview) {
                    if (objview.fillcolor === "white") objview.fillcolor = "";
                    if (objview.fillcolor2 === "white") objview.fillcolor2 = "";
                    if (objview.strokecolor === "black") objview.strokecolor = "";
                    if (objview.strokecolor2 === "black") objview.strokecolor2 = "";
                    if (objview.textcolor === "black") objview.textcolor = "";
                    if (objview.textcolor2 === "black") objview.textcolor2 = "";
                }
                // setTypeView applies CORE_META defaults and can overwrite the
                // persisted ObjectView presentation. Explicit values from the
                // imported ObjectView are authoritative and must be restored
                // after the type-view fallback has been resolved.
                if (typeof item.fillcolor === "string" && item.fillcolor.trim())
                    objview.fillcolor = item.fillcolor;
                if (typeof item.strokecolor === "string" && item.strokecolor.trim())
                    objview.strokecolor = item.strokecolor;
                if (Number.isFinite(Number(item.strokewidth)) && Number(item.strokewidth) > 0)
                    objview.strokewidth = Number(item.strokewidth);
                if (typeof item.icon === "string" && item.icon.trim())
                    objview.icon = item.icon;
                // metis.addObjectView(objview);
                object.addObjectView(objview);
                modelview.addObjectView(objview);
                if (debug) console.log("Importing object: " + item.id + ", " + item.name);
            }
        }
    }
    importRelshipView(item: akm.cxRelationshipView, modelview: akm.cxModelView) {
        if (item) {
            const source: any = item as any;
            const relshipRef = source.relshipRef || source.relship?.id;
            const relship = jsnMetis.findRelationship(relshipRef);
            if (relship) {
                const relview = new akm.cxRelationshipView(item.id, item.name, relship, item.description);
                relview.setRelationship(relship);
                relview.relshipRef = relshipRef;
                const fromobjviewRef = source.fromobjviewRef || source.fromObjviewRef || source.fromObjview?.id;
                const toobjviewRef = source.toobjviewRef || source.toObjviewRef || source.toObjview?.id;
                const fromobjview: any = modelview.findObjectView(fromobjviewRef);
                const toobjview: any = modelview.findObjectView(toobjviewRef);
                relview.fromobjviewRef = fromobjviewRef;
                relview.toobjviewRef = toobjviewRef;
                relview.setFromObjectView(fromobjview);
                relview.setToObjectView(toobjview);
                if (item.fromPortid) relview.fromPortid = item.fromPortid;
                if (item.toPortid) relview.toPortid = item.toPortid;
                // relview.setData(item.data);
                const typeviewRef = source.typeviewRef || source.typeview?.id;
                if (typeviewRef) {
                    const reltypeview = jsnMetis.findRelationshipTypeView(typeviewRef);
                    if (reltypeview)
                        relview.setTypeView(reltypeview);
                }
                relview.template = item.template;
                relview.template2 = item.template2;
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
                relview.curve = item.curve;
                relview.corner = item.corner;
                relview.points = item.points;
                relview.markedAsDeleted = item.markedAsDeleted;
                relview.modified = item.modified;
                relview.visible = item.visible;
                // metis.addRelationshipView(relview);
                modelview.addRelationshipView(relview);
                if (debug) console.log("Importing object: " + item.id + ", " + item.name);
            }
        }
    }
}
/*
export class jsnImportTypeDefinition {
	objecttypes:	akm.cxObjectType[];

    constructor(metamodel: akm.cxMetaModel, importedData: any) {
        this.objecttypes = importedData.objecttypes;
        if (utils.objExists(this.objecttypes)) {
            this.objecttypes.forEach(objecttype => {
                this.importObjecttype(metamodel, objecttype);
            });
        }
    }
    importObjecttype(metamodel: akm.cxMetaModel, item: any) {
        let objtype = metamodel.findObjectTypeByName(item.name);
        if (!utils.objExists(objtype)) {
            objtype = new akm.cxObjectType(item.id, item.name, item.description);
        } else {
            for (const prop in item) {
                if (utils.objExists(item[prop])) {
                    let otype = (objtype as any);
                    otype[prop] = item[prop];
                }
            }
        }
        if (utils.objExists(item.typeviewRef)) {
            const objtypeview = jsnMetis.findObjectTypeView(item.typeviewRef);
            if (objtype && objtypeview)
                objtype.setDefaultTypeView(objtypeview);
        }
        jsnMetis.addObjectType(objtype);
        if (objtype) metamodel.addObjectType(objtype);
        if (debug) console.log("Importing objecttype: " + item.id + ", " + item.name);

    }
}
export class jsnObjtypePropertyDialog {
	id:					string;
	name:				string;
	description:		string;
	tabs:				any[];
	properties:			jsnPropertyDefinition[];
	buttons:			any[];
    constructor(objtype: akm.cxObjectType) {
        this.id          = objtype.id;
        this.name        = objtype.name;
        this.description = objtype.description;
        this.tabs        = [];
        this.properties  = [];
        this.buttons     = [];
    }
}
*/
/*  Tabs may be:
    - Main
    - Properties
    - Methods
    - Criteria
    - Typeviews
    - Links/Relationships
    - Symbol

class jsnTab {
	parent:		any;
	name:		string;
	type:		any;
	sections:	any[];
	buttons:	any[];
    constructor(dialog: any, name: string, type: any) {
        this.parent     = dialog;
        this.name       = name;
        this.type       = type;
        this.sections   = [];
        this.buttons    = [];
    }
}
class jsnSection {
	parent:		any;
	name:		string;
	type:		any;
	fields:	any[];
    constructor(tab: string, name: string, type: string) {
        this.parent     = tab;
        this.name       = name;
        this.type       = type;
        this.fields     = [];

    }
}
*/
