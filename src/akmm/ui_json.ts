// @ts- nocheck
const debug = false; 

const utils = require('./utilities');
import * as akm from './metamodeller';
const constants = require('./constants');

let jsnMetis = null;

export class jsnExportMetis {
    name:                       string;
    description:                string;
    metamodels:                 jsnMetaModel[];
    models:                     jsnModel[];
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
        this.name                           = metis.name;
        this.description                    = metis.description;
        this.allowGenerateCurrentMetamodel  = metis.allowGenerateCurrentMetamodel;
        this.metamodels                     = [];
        this.models                         = [];
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

        // Code
        let metamodels = metamodel.getContainedMetamodels();
        if (metamodels) {
            const cnt = metamodels.length;
            for (let i = 0; i < cnt; i++) {
                const metamodel = metamodels[i];
                this.metamodelRefs.push(metamodel.id);
            }
        }
        let subMetamodels = metamodel.getSubMetamodels();
        if (subMetamodels) {
            const cnt = subMetamodels.length;
            for (let i = 0; i < cnt; i++) {
                const metamodel = subMetamodels[i];
                this.subMetamodelRefs.push(metamodel.id);
            }
        }
        let subModels = metamodel.getSubModels();
        if (subModels) {
            const cnt = subModels.length;
            for (let i = 0; i < cnt; i++) {
                const submodel = subModels[i];
                this.subModelRefs.push(metamodel.id);
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
                const reltype = reltypes[i];
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
            this.subModelRefs.push(model.id);
        }
    }
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
        const props = objtype.getProperties(false);
        let cnt = props?.length;
        for (let i = 0; i < cnt; i++) {
            const prop = props[i];
            this.addProperty(prop);
        }
        const attrs = objtype.getAttributes();
        cnt = attrs?.length;
        for (let i = 0; i < cnt; i++) {
            const attr = attrs[i];
            this.addAttribute(attr);            
        }
        const ports = objtype.getPorts();
        cnt = ports?.length;
        for (let i = 0; i < cnt; i++) {
            const port = ports[i];
            this.addPort(port);
        }
        const mtds = objtype.getMethods();
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
        const props = reltype.getProperties(true);
        let cnt = props?.length;
        for (let i = 0; i < cnt; i++) {
            const prop = props[i];
            this.addProperty(prop);
        }
    }
    addProperty(prop: akm.cxProperty) {
        if (utils.objExists(prop)) {
            const gProperty = new jsnProperty(prop);
            this.properties.push(gProperty);
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
    viewkind:        string;
    isGroup:         boolean;
    group:           string;
    template:        string;
    figure:          string;
    geometry:        string;
    fillcolor:       string;
    fillcolor2:      string;
    strokecolor:     string;
    strokecolor1:    string;
    strokecolor2:    string;
    strokewidth:     string;
    textcolor:       string;
    textscale:       string;
    memberscale:     string;
    icon:            string;
    markedAsDeleted: boolean;
    modified:        boolean;
    constructor(objtypeview: akm.cxObjectTypeView) {
        this.id              = objtypeview.id;
        this.name            = objtypeview.name;
        this.description     = "";
        this.typeRef         = objtypeview.typeRef;
        this.viewkind        = objtypeview.getViewKind();
        this.template        = objtypeview.getTemplate();
        this.figure          = objtypeview.getFigure();
        this.geometry        = objtypeview.getGeometry();
        this.fillcolor       = objtypeview.getFillcolor();
        this.fillcolor2      = objtypeview.getFillcolor2();
        this.strokecolor     = objtypeview.getStrokecolor();
        this.strokecolor1    = this.strokecolor;
        this.strokecolor2    = objtypeview.getStrokecolor2();
        this.strokewidth     = objtypeview.getStrokewidth();
        this.textcolor       = objtypeview.getTextcolor();
        this.textscale       = objtypeview.getTextscale();
        this.memberscale     = objtypeview.getMemberscale();
        this.icon            = objtypeview.getIcon();
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
export class jsnRelshipTypeView {
    id:              string;
    name:            string;
    description:     string;
    typeRef:         string;
    template:        string;
    strokecolor:     string;
    strokecolor1:    string;
    strokewidth:     string;
    textcolor:       string;
    textscale:       string;
    dash:            string;
    fromArrow:       string;
    toArrow:         string;
    fromArrowColor:  string;
    toArrowColor:    string;
    routing:         string;
    corner:          string;
    curve:           string;
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
            const gModel = new jsnModel(model, includeViews);
            this.models.push(gModel);
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
                case 'fs_collection':
                case 'parentModel':
                case 'propertyValues':
                case 'toObject':
                case 'type':
                case 'typeview':
                case 'typeName':
                case 'typeRef':
                case 'generatedTypeId':
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
        for (let i=0; i<properties?.length; i++) {
          const prop = properties[i];
          if (!prop) continue;
          const propname = prop.name;
          const value = object.getStringValue2(propname);
          if (debug) console.log('885 propname, value', propname, value);
          this[propname] = value;                      
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
    property:   akm.cxProperty;
    value:      string;
    constructor(propval: akm.cxPropertyValue) {
        this.property   = propval.property;
        this.value      = propval.value;
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
    includeInheritedReltypes: boolean;
    UseUMLrelshipkinds: boolean;
    modelRef:           string;
    viewstyleRef:       string;
    objectviews:        jsnObjectView[];
    relshipviews:       jsnRelshipView[];
    objecttypeviews:    jsnObjectTypeView[];
    relshiptypeviews:   jsnRelshipTypeView[];
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
    description:     string;
    text:            string;
    objectRef:       string;
    typeviewRef:     string;
    group:           string;
    isGroup:         boolean;
    groupLayout:     string;
    isExpanded:     boolean;
    isSelected:      boolean;
    loc:             string;
    size:            string;
    scale:           number;
    memberscale:     number;
    arrowscale:      string;
    viewkind:        string;
    markedAsDeleted: boolean;
    modified:        boolean;
    template:        string;
    figure:          string;
    geometry:        string;
    fillcolor:       string;
    fillcolor2:      string;
    strokecolor:     string;
    strokecolor2:    string;
    strokewidth:     string;
    textcolor:       string;
    textscale:       string;
    icon:            string;
    constructor(objview: akm.cxObjectView) {
        this.id              = objview?.id;
        this.name            = objview?.name;
        this.description     = objview?.description;
        this.objectRef       = objview?.object?.id;
        this.typeviewRef     = objview?.typeview?.id;
        this.group           = objview?.group;
        this.viewkind        = objview?.viewkind;
        this.isGroup         = objview?.isGroup;
        this.isExpanded     = objview?.isExpanded;
        this.isSelected     = objview?.isSelected;
        this.loc             = objview?.loc;
        this.template        = objview?.template;
        this.figure          = objview?.figure;
        this.geometry        = objview?.geometry;
        this.fillcolor       = objview?.fillcolor;
        this.fillcolor2      = objview?.fillcolor2;
        this.strokecolor     = objview?.strokecolor;
        this.strokecolor2    = objview?.strokecolor2;
        this.strokewidth     = objview?.strokewidth;
        this.textcolor       = objview?.textcolor;
        this.icon            = objview?.icon;
        this.size            = objview?.size;
        this.scale           = Number(objview?.scale1);
        this.memberscale     = Number(objview?.memberscale);
        this.textscale       = objview?.textscale;
        this.arrowscale      = objview?.arrowscale;
        this.markedAsDeleted = objview?.markedAsDeleted;
        this.modified        = objview?.modified;
    }
}
export class jsnRelshipView {
    id:              string;
    name:            string;
    description:     string;
    relshipRef:      string;
    typeviewRef:     string;
    fromobjviewRef:  string;
    toobjviewRef:    string;
    fromPortid:      string;
    toPortid:        string;
    template:        string;
    arrowscale:      string;
    strokecolor:     string;
    strokewidth:     string;
    textcolor:       string;
    textscale:       string;
    dash:            string;
    fromArrow:       string;
    toArrow:         string;
    fromArrowColor:  string;
    toArrowColor:    string;
    routing:         string;
    corner:          string;
    curve:           string;
    points:          any;
    markedAsDeleted: boolean;
    modified:        boolean;
    constructor(relview: akm.cxRelationshipView) {
        this.id              = relview?.id;
        this.name            = relview?.name;
        this.description     = "";
        this.relshipRef      = "";
        this.typeviewRef     = "";
        this.template        = relview?.template;
        this.arrowscale      = relview?.arrowscale;
        this.strokecolor     = relview?.strokecolor;
        this.strokewidth     = relview?.strokewidth;
        this.textcolor       = relview?.textcolor;
        this.textscale       = relview?.textscale;
        this.dash            = relview?.dash;
        this.fromArrow       = relview?.fromArrow;
        this.toArrow         = relview?.toArrow;
        this.fromArrowColor  = relview?.fromArrowColor;
        this.toArrowColor    = relview?.toArrowColor;
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
        // Code
        if (relview?.description)
            this.description = relview.description;
        if (relview?.relship)
            this.relshipRef = relview.relship.id;
        if (relview?.typeview)
            this.typeviewRef = relview.typeview.id;
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
        objtypeview.setGeometry(item.geometry);
        objtypeview.setFillcolor(item.fillcolor);
        objtypeview.setFillcolor2(item.fillcolor2);
        objtypeview.setStrokecolor(item.strokecolor);
        objtypeview.setStrokecolor2(item.strokecolor2);
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
                let obj = new akm.cxObject(item.id, item.name, objtype, item.description);
                obj.setType(objtype);
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
                reltype = metamodel.findRelationshipTypeByName(item.name);
                if (!reltype) {
                    reltype = metamodel.findRelationshipTypeByName(constants.types.AKM_GENERIC_REL);
                }
            }
            const fromObj = jsnMetis.findObject(item.fromObjectRef);
            const toObj = jsnMetis.findObject(item.toObjectRef);
            if (reltype && fromObj && toObj) {
                const rel = new akm.cxRelationship(item.id, item.name, reltype, fromObj, toObj, item.description);
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
                const objview = new akm.cxObjectView(item.id, item.name, object, item.description);
                objview.group = item.group;
                objview.isGroup = item.isGroup;
                objview.setObject(object);
                if (item.typeviewRef) {
                    const objtypeview = jsnMetis.findObjectTypeView(item.typeviewRef);
                    if (objtypeview)
                        objview.setTypeView(objtypeview);
                }
                // metis.addObjectView(objview);
                object.addObjectView(objview);
                modelview.addObjectView(objview);
                if (debug) console.log("Importing object: " + item.id + ", " + item.name);
            }
        }
    }
    importRelshipView(item: akm.cxRelationshipView, modelview: akm.cxModelView) {
        if (item) {
            const relship = jsnMetis.findRelationship(item.relship.id);
            if (relship) {
                const relview = new akm.cxRelationshipView(item.id, item.name, relship, item.description);
                relview.setRelationship(relship);
                const fromobjview: any = modelview.findObjectView(item.fromObjview.id);
                const toobjview: any = modelview.findObjectView(item.toObjview.id);
                relview.setFromObjectView(fromobjview);
                relview.setToObjectView(toobjview);
                // relview.setData(item.data);
                if (item.typeview.id) {
                    const reltypeview = jsnMetis.findRelationshipTypeView(item.typeview.id);
                    if (reltypeview)
                        relview.setTypeView(reltypeview);
                }
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