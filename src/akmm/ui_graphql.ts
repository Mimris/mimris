// @ts-nocheck
const debug = false;

const utils = require('./utilities');
const glb = require('./akm_globals');
import * as akm from './metamodeller';
//import * as gojs  from './components/akmm/ui_gojs';

export class gqlExportMetis {
    repositories:           gqlRepository[];
    metamodels:             gqlMetaModel[];
    models:                 gqlModel[];
    //modelviews:             gqlModelView[];
    //datatypes:              gqlDatatype[];
    //enumerations:           gqlEnumeration[];
    pasteViewsOnly:         boolean;
    deleteViewsOnly:        boolean;
    currentRepositoryRef:   string;
    currentMetamodelRef:    string;
    currentModelRef:        string;
    currentModelviewRef:    string;
    currentTemplateModelRef: string;
    // Constructor
    constructor(metis: akm.cxMetis, includeViews: boolean) {
        this.repositories = [];
        this.metamodels   = [];
        this.models       = [];
        //this.modelviews   = [];
        //this.datatypes    = [];
        //this.enumerations = [];
        this.currentRepositoryRef    = "";
        this.currentMetamodelRef     = "";
        this.currentModelRef         = "";
        this.currentModelviewRef     = "";
        this.currentTemplateModelRef = "";
        // Code
        if (metis) {
            const repositories = metis.getRepositories();
            if (repositories) {
                const cnt = repositories.length;
                for (let i = 0; i < cnt; i++) {
                    const repository = repositories[i];
                    this.addRepository(repository);
                }
            }
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
            if (metis.currentRepository)
                this.currentRepositoryRef = metis.currentRepository.id;
            if (metis.currentMetamodel)
                this.currentMetamodelRef = metis.currentMetamodel.id;
            if (metis.currentModel)
                this.currentModelRef = metis.currentModel.id;
            if (metis.currentModelview)
                this.currentModelviewRef = metis.currentModelview.id;
            if (metis.currentTemplateModel)
                this.currentTemplateModelRef = metis.currentTemplateModel.id;
            
        }
    }
    // Functions
    addRepository(repository: akm.cxRepository) {
        if (repository) {
            const gRepository = new gqlRepository(repository);
            this.repositories.push(gRepository);
        }
    }
    addMetamodel(metamodel: akm.cxMetaModel, includeViews: boolean) {
        if (metamodel) {
            const gMetamodel = new gqlMetaModel(metamodel, includeViews);
            this.metamodels.push(gMetamodel);
        }
    }
    addModel(model: akm.cxModel, includeViews: boolean) {
        if (model && model.metamodel) {
            const gModel = new gqlModel(model, includeViews);
            this.models.push(gModel);
        }
    }
}
export class gqlRepository {
    id:                 string;
    name:               string;
    description:        string;
    constructor(repository: akm.cxRepository) {
        this.id             = repository.id;
        this.name           = repository.name;
        this.description    = repository.description;
    }
}

export class gqlExportMetaModel {
    metamodels: gqlMetaModel[];
    constructor() {
        this.metamodels = new Array();;
    }
    addMetamodel(metamodel: akm.cxMetaModel, includeViews: boolean) {
        if (metamodel) {
            const gMetamodel = new gqlMetaModel(metamodel, includeViews);
            this.metamodels.push(gMetamodel);
        }
    }
}
export class gqlMetaModel {
    id:                 string;
    name:               string;
    description:        string;
    objecttypes:        gqlObjectType[];
    relshiptypes:       gqlRelationshipType[];
    properties:         gqlProperty[];
    datatypes:          gqlDatatype[];
    unittypes:          gqlUnitCategory[];
    objecttypeviews:    gqlObjectTypeView[];
    objtypegeos:        gqlObjectTypegeo[];
    relshiptypeviews:   gqlRelshipTypeView[];
    deleted:            boolean;
    modified:           boolean;
    constructor(metamodel: akm.cxMetaModel, includeViews: boolean) {
        this.id = metamodel.id;
        this.name = metamodel.name;
        this.description = (metamodel.description) ? metamodel.description : "";
        this.objecttypes = [];
        this.relshiptypes = [];
        this.properties = [];
        this.datatypes = [];
        this.unittypes = [];
        this.objecttypeviews = [];
        this.objtypegeos = [];
        this.relshiptypeviews = [];
        this.deleted  = false;
        this.modified = false;

        // Code
        const objtypes = metamodel.getObjectTypes();
        if (objtypes) {
            const cnt = objtypes.length;
            for (let i = 0; i < cnt; i++) {
                const objtype = objtypes[i];
                this.addObjectType(objtype, includeViews);
            }
        }
        const reltypes = metamodel.getRelshipTypes();
        if (reltypes) {
            const cnt = reltypes.length;
            for (let i = 0; i < cnt; i++) {
                const reltype = reltypes[i];
                this.addRelationshipType(reltype, includeViews);
            }
        }
        const datatypes = metamodel.getDatatypes();
        if (datatypes) {
            const cnt = datatypes.length;
            for (let i = 0; i < cnt; i++) {
                const datatype = datatypes[i];
                this.addDataType(datatype);
            }
        }
        // let unittypes = metamodel.getUnitCategories();
        // if (unittypes) {
        //     let cnt = unittypes.length;
        //     for (let i = 0; i < cnt; i++) {
        //         let unittype = unittypes[i];
        //         this.addUnittype(unittype);
        //     }
        // }
        if (includeViews) {
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
    addObjectType(objtype: akm.cxObjectType, includeViews: boolean) {
        if (utils.objExists(objtype) &&
            !objtype.isDeleted()
        ) {
            const gObjtype = new gqlObjectType(objtype, includeViews);
            this.objecttypes.push(gObjtype);
        }
    }
    addRelationshipType(reltype: akm.cxRelationshipType, includeViews: boolean) {
        if (
            utils.objExists(reltype) &&
            !reltype.isDeleted() &&
            utils.objExists(reltype.fromObjtype) &&
            utils.objExists(reltype.toObjtype)
        ) {
            const gReltype = new gqlRelationshipType(reltype, includeViews);
            this.relshiptypes.push(gReltype);
        }
    }
    addDataType(datatype: akm.cxDatatype) {
        if (utils.objExists(datatype) &&
            !datatype.isDeleted()
        ) {
            const gDatatype = new gqlDatatype(datatype);
            this.datatypes.push(gDatatype);
        }
    }
    addProperty(prop: akm.cxProperty) {
        if (utils.objExists(prop) &&
            !prop.isDeleted()
        ) {
            const gProp = new gqlProperty(prop);
            this.properties.push(gProp);
        }
    }
    addUnittype(unittype: akm.cxUnitCategory) {
        if (utils.objExists(unittype)) {
            let gUnittype = new gqlUnitCategory(unittype);
            this.unittypes.push(gUnittype);
        }
    }
    addObjectTypeView(objtypeview: akm.cxObjectTypeView) {
        if (objtypeview && !objtypeview.isDeleted()
        ) {
            if (objtypeview.type) {
                const gObjtypeview = new gqlObjectTypeView(objtypeview);
                this.objecttypeviews.push(gObjtypeview);
            }
        }
    }
    addObjtypeGeo(objtypegeo: akm.cxObjtypeGeo) {
        if (objtypegeo) {
            let gObjtypegeo = new gqlObjectTypegeo(objtypegeo);
            this.objtypegeos.push(gObjtypegeo);
        }
    }
    addRelshipTypeView(reltypeview: akm.cxRelationshipTypeView) {
        if (reltypeview &&
            !reltypeview.isDeleted()) {
            if (reltypeview.type) {
                const gReltypeview = new gqlRelshipTypeView(reltypeview);
                this.relshiptypeviews.push(gReltypeview);
            }
        }
    }
    //
}
export class gqlObjectType {
    id:             string;
    name:           string;
    description:    string;
    abstract:       boolean;
    viewkind:       string;
    typename:       string;
    typeviewRef:    string;
    properties:     gqlProperty[];
    deleted:        boolean;
    modified:       boolean;
    constructor(objtype: akm.cxObjectType, includeViews: boolean) {
        this.id             = objtype.id;
        this.name           = objtype.name;
        this.abstract       = objtype.abstract;
        this.viewkind       = objtype.viewkind;
        this.typename       = 'Object type';
        this.typeviewRef    = objtype.typeview ? objtype.typeview.id : "";
        this.description    = (objtype.description) ? objtype.description : "";
        this.properties     = [];
        this.deleted        = objtype.deleted;
        this.modified       = objtype.modified;
        // Code
        const p = objtype.getProperties(true);
        if (p) {
            const props = p[0];
            if (props) {
                if (props && props.length > 0) {
                    const cnt = props.length;
                    for (let i = 0; i < cnt; i++) {
                        const prop = props[i];
                        this.addProperty(prop);
                    }
                }
            }
        }
        //this.loc  = (includeViews) ? objtype.loc : "";
        //this.size = (includeViews) ? objtype.size : "";
    }
    addProperty(prop: akm.cxProperty) {
        if (utils.objExists(prop)) {
            const gProperty = new gqlProperty(prop);
            this.properties.push(gProperty);
        }
    }
}
export class gqlRelationshipType {
    id:             string;
    name:           string;
    description:    string;
    typeviewRef:    string;
    properties:     gqlProperty[];
    relshipkind:    string;
    viewkind:       string;
    fromobjtypeRef: string;
    toobjtypeRef:   string;
    deleted:        boolean;
    modified:       boolean;
    constructor(reltype: akm.cxRelationshipType, includeViews: boolean) {
        this.id             = reltype.id;
        this.name           = reltype.name;
        this.relshipkind    = reltype.relshipkind;
        this.viewkind       = reltype.viewkind;
        this.fromobjtypeRef = (reltype.fromObjtype) ? reltype.fromObjtype.id : "";
        this.toobjtypeRef   = (reltype.toObjtype) ? reltype.toObjtype.id : "";
        this.typeviewRef    = "";
        this.description    = (reltype.description) ? reltype.description : "";
        this.properties     = [];
        this.deleted        = reltype.deleted;
        this.modified       = reltype.modified;
        if (includeViews) {
            this.typeviewRef = (reltype.typeview) ? reltype.typeview.id : "";
        }
        // Code
        const p = reltype.getProperties(true);
        if (p) {
            const props = p[0];
            if (props !== undefined) {
                if (utils.objExists(props) && props.length > 0) {
                    const cnt = props.length;
                    for (let i = 0; i < cnt; i++) {
                        const prop = props[i];
                        this.addProperty(prop);
                    }
                }
            }
        }
    }
    addProperty(prop: akm.cxProperty) {
        if (utils.objExists(prop)) {
            const gProperty = new gqlProperty(prop);
            this.properties.push(gProperty);
        }
    }
}
export class gqlExportDatatypes {
    datatypes: gqlDatatype[];
    constructor() {
        this.datatypes = new Array();
    }

    addDatatype(datatype: akm.cxDatatype) {
        if (utils.objExists(datatype)) {
            const gDatatype = new gqlDatatype(datatype);
            this.datatypes.push(gDatatype);
        }
    }
}
export class gqlDatatype {
    id:             string;
    name:           string;
    description:    string;
    datatypeRef:    string;
    defaultValue:   string;
    allowedValues:  any[];
    deleted:        boolean;
    modified:       boolean;
    constructor(dtype: akm.cxDatatype) {
        this.id             = dtype.id;
        this.name           = dtype.name;
        this.description    = "";
        this.datatypeRef    = utils.objExists(dtype.isOfDatatype) ? dtype.id : "";
        this.defaultValue   = dtype.defaultValue;
        this.allowedValues  = dtype.allowedValues;
        this.deleted        = dtype.deleted;
        this.modified       = dtype.modified;
        // Code
        if (utils.objExists(dtype.description))
            this.description = dtype.description;
    }
}
export class gqlUnitCategory {
    id:             string;
    name:           string;
    description:    string;
    deleted:        boolean;
    modified:       boolean;
    constructor(utype: akm.cxUnitCategory) {
        this.id             = utype.id;
        this.name           = utype.name;
        this.description    = "";
        this.deleted        = utype.deleted;
        this.modified       = utype.modified;
        // Code
        if (utils.objExists(utype.description))
            this.description = utype.description;
    }
}
export class gqlUnit {
    id:             string;
    name:           string;
    description:    string;
    deleted:        boolean;
    modified:       boolean;
    constructor(unit: akm.cxUnit) {
        this.id             = unit.id;
        this.name           = unit.name;
        this.description    = "";
        this.deleted        = unit.deleted;
        this.modified       = unit.modified;
        // Code
        if (utils.objExists(unit.description))
            this.description = unit.description;
    }
}
export class gqlObjectTypeView {
    id:             string;
    name:           string;
    description:    string;
    typeRef:        string;
    viewkind:       string;
    isGroup:        boolean;
    group:          string;
    figure:         string;
    fillcolor:      string;
    strokecolor:    string;
    strokewidth:    string;
    icon:           string;
    deleted:        boolean;
    modified:       boolean;
    constructor(objtypeview: akm.cxObjectTypeView) {
        this.id             = objtypeview.id;
        this.name           = objtypeview.name;
        this.description    = "";
        this.typeRef        = objtypeview.type?.id;
        this.isGroup        = objtypeview.getIsGroup();
        this.group          = objtypeview.getGroup();
        this.viewkind       = objtypeview.getViewKind();
        this.figure         = objtypeview.getFigure();
        this.fillcolor      = objtypeview.getFillcolor();
        this.strokecolor    = objtypeview.getStrokecolor();
        this.strokewidth    = objtypeview.getStrokewidth();
        this.icon           = objtypeview.getIcon();
        this.deleted        = objtypeview.deleted;
        this.modified       = objtypeview.modified;
        if (objtypeview.description)
            this.description = objtypeview.description;
    }
}
export class gqlObjectTypegeo {
    id:             string;
    name:           string;
    description:    string;
    typeRef:        string;
    metamodelRef:   string;
    loc:            string;
    size:           string;
    deleted:        boolean;
    modified:       boolean;
    constructor(objtypegeo: akm.cxObjtypeGeo) {
        this.id             = objtypegeo.id;
        this.name           = objtypegeo.name;
        this.typeRef        = (objtypegeo.type) ? objtypegeo.type.id : "";
        this.metamodelRef   = (objtypegeo.metamodel) ? objtypegeo.metamodel.id : "";
        this.loc            = objtypegeo.getLoc();
        this.size           = objtypegeo.getSize();
        this.description    = (objtypegeo.description) ? objtypegeo.description : "";
        this.deleted        = objtypegeo.deleted;
        this.modified       = objtypegeo.modified;
    }
}
export class gqlRelshipTypeView {
    id:             string;
    name:           string;
    description:    string;
    typeRef:        string;
    strokecolor:    string;
    strokewidth:    string;
    dash:           string;
    fromArrow:      string;
    toArrow:        string;
    fromArrowColor: string;
    toArrowColor:   string;
    deleted:        boolean;
    modified:       boolean;
    constructor(reltypeview: akm.cxRelationshipTypeView) {
        this.id             = reltypeview.id;
        this.name           = reltypeview.name;
        this.description    = (reltypeview.description) ? reltypeview.description : "";
        this.typeRef        = reltypeview.type.id;
        this.strokecolor    = reltypeview.strokecolor;
        this.strokewidth    = reltypeview.strokewidth;
        this.dash           = reltypeview.dash;
        this.fromArrow      = reltypeview.fromArrow;
        this.toArrow        = reltypeview.toArrow;
        this.fromArrowColor = reltypeview.fromArrowColor;
        this.toArrowColor   = reltypeview.toArrowColor;
        this.deleted        = reltypeview.deleted;
        this.modified       = reltypeview.modified;
    }
}
export class gqlProperty {
    id:                 string;
    name:               string;
    description:        string;
    datatypeRef:        string;
    unitCategoryRef:    string;
    deleted:            boolean;
    modified:           boolean;
    constructor(prop: akm.cxProperty) {
        this.id         =   prop.id;
        this.name       = prop.name;
        this.deleted    = prop.deleted;
        this.modified   = prop.modified;
        // Code
        this.description = (prop.description) ? prop.description : "";
        this.datatypeRef = (prop.datatype) ? prop.datatype.id : "";
        this.unitCategoryRef = prop.unitCategory ? prop.unitCategory.id : "";
        if (prop.datatypeRef)
            this.datatypeRef = prop.datatypeRef;
        if (prop.unitCategoryRef)
            this.unitCategoryRef = prop.unitCategoryRef;
        if (prop.defaultValue)
            this.description = prop.defaultValue;
    }
}
export class gqlModel {
    id:                     string;
    name:                   string;
    description:            string;
    metamodelRef:           string;
    targetMetamodelRef:     string;
    sourceModelRef:         string;
    targetModelRef:         string;
    isTemplate:             boolean;
    templates:              gqlModelView[];
    objects:                gqlObject[];
    relships:               gqlRelationship[];
    modelviews:             gqlModelView[];
    deleted:                boolean;
    modified:               boolean;
    pasteViewsOnly:         boolean;
    deleteViewsOnly:        boolean;
    constructor(model: akm.cxModel, includeViews: boolean) {
        this.id             = model.id;
        this.name           = model.name;
        this.description    = model.description ? model.description : "";
        this.metamodelRef   = model.getMetamodel() ? model.getMetamodel().id : "";
        this.sourceMetamodelRef = model.sourceMetamodelRef;
        this.targetMetamodelRef = model.targetMetamodelRef;
        this.sourceModelRef = model.sourceModelRef;
        this.targetModelRef = model.targetModelRef;
        this.isTemplate     = model.isTemplate;
        this.templates      = [];
        this.objects        = [];
        this.relships       = [];
        this.modelviews     = [];
        this.deleted        = model.deleted;
        this.modified       = model.modified;
        this.pasteViewsOnly = model.pasteViewsOnly;
        this.deleteViewsOnly = model.deleteViewsOnly;
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
            const gModelView = new gqlModelView(mv);
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
        if (obj && !obj.isDeleted() && obj.type) {
            const gObject = new gqlObject(obj);
            this.objects.push(gObject);
        }
    }
    addRelationship(rel: akm.cxRelationship) {
        if (rel && !rel.isDeleted() && rel.type && rel.fromObject && rel.toObject) {
            const gRelship = new gqlRelationship(rel);
            this.relships.push(gRelship);
        }
    }
    addTemplate(tmpl: akm.cxModelView) {
        if (tmpl) {
            const gModelView = new gqlModelView(tmpl);
            this.templates.push(gModelView);
        }
    }
}
export class gqlExportModel {
    models: gqlModel[];
    constructor(includeViews: boolean) {
        this.models = [];
    }
    addModel(model: akm.cxModel, includeViews: boolean) {
        if (model) {
            const gModel = new gqlModel(model, includeViews);
            this.models.push(gModel);
        }
    }
}
export class gqlObject {
    id:             string;
    name:           string;
    description:    string;
    typeRef:        string;
    objectviews:    gqlObjectView[] | null;
    inputrels:      gqlRelationship[] | null;
    outputrels:     gqlRelationship[] | null;
    propertyValues: any[];
    deleted:        boolean;
    modified:       boolean;
    constructor(object: akm.cxObject) {
        this.id             = object.id;
        this.name           = object.name;
        this.description    = object.description ? object.description : "";
        this.typeRef        = object.type ? object.type.id : "";
        this.objectviews    = [];
        this.inputrels      = [];
        this.outputrels     = [];
        this.propertyValues = [];
        this.deleted        = object.deleted;
        this.modified       = object.modified;

        // Code
        const objviews = object.objectviews;
        if (debug) console.log('734 gqlObject - objectviews', objviews);
        if (objviews) {
            this.objectviews = new Array();
            const cnt = objviews.length;
            for (let i = 0; i < cnt; i++) {
                const objview = objviews[i];
                this.addObjectView(objview);
            }
        }
        const inputrels = object.inputrels;
        if (debug) console.log('744 gqlObject - inputrels', inputrels);
        if (inputrels) {
            this.inputrels = new Array();
            const cnt = inputrels.length;
            for (let i = 0; i < cnt; i++) {
                const inputrel = inputrels[i];
                this.addInputrel(inputrel);
            }
        }
        const outputrels = object.outputrels;
        if (debug) console.log('744 gqlObject - outputrels', outputrels);
        if (outputrels) {
            this.outputrels = new Array();
            const cnt = outputrels.length;
            for (let i = 0; i < cnt; i++) {
                const outputrel = outputrels[i];
                this.addOutputrel(outputrel);
            }
        }
        const values = object.valueset;
        if (debug) console.log('638 gqlObject - values', values);
        if (values) {
            this.propvalues = new Array();
            const cnt = values.length;
            for (let i = 0; i < cnt; i++) {
                const val = values[i];
                this.addPropertyValue(val);
            }
        }
    }
    addInputrel(relship: akm.cxRelationship) {
        if (!relship)
            return;
        const gRelship = new gqlRelationship(relship);
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
        this.inputrels.push(gRelship);
    }
    addOutputrel(relship: akm.cxRelationship) {
        if (!relship)
            return;
        const gRelship = new gqlRelationship(relship);
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
        this.outputrels.push(gRelship);
    }
    addObjectView(objview: akm.cxObjectView) {
        if (!objview) 
            return;
        const gObjview = new gqlObjectView(objview);
        if (!this.objectviews)
            this.objectviews = new Array();
        const len = this.objectviews.length;
        for (let i=0; i<len; i++) {
            const ov = this.objectviews[i];
            if (ov.id === objview.id) {
                // Relationship is already in list
                return;
            }
        }
        this.objectviews.push(gObjview);
    }
    addPropertyValue(val: akm.cxPropertyValue) {
        if (!val)
            return;
        const gPropval = new gqlPropertyValue(val);
        if (!this.propertyValues)
            this.propertyValues = new Array();
        const len = this.propertyValues.length;
        for (let i=0; i<len; i++) {
            const pval = this.propertyValues[i];
            if (pval.id === val.id) {
                // Relationship is already in list
                return;
            }
        }
        this.propertyValues.push(gPropval);
    }
}
/*
export class gqlExportTypeDefinition {
	objecttypes:		gqlTypeDefinition[];
    constructor() {
        this.objecttypes = [];
    }
    addTypeDefinition(typedef: any) {
        if (utils.objExists(typedef)) {
            const gTypeDefinition = new gqlTypeDefinition(typedef);
            this.objecttypes.push(gTypeDefinition);
        }
    }
}
export class gqlTypeDefinition {
	id:					string;
	name:				string;
	description:		string;
	properties:			gqlPropertyDefinition[];

    constructor(typedef: akm.cxInstance) {
        this.id    = typedef.id;
        this.name  = typedef.name;
        this.description = (typedef.description) ? typedef.description : "";
        this.properties = new Array();
        // Code
        // let typeRef     = object.getType().id;
        const proptypes   = new Array();
        const rels: akm.cxRelationship[] = typedef.findOutputRelships(glb.myModel, undefined);
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
                const prop     = new gqlPropertyDefinition(proptype);
                if (utils.objExists(prop)) {
                    this.properties.push(prop);
                }
            }
       }
    }
}
export class gqlPropertyDefinition {
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
        const rels = proptype.findOutputRelships(glb.myModel);
        if (utils.isArrayEmpty(rels)) {
            return;
        } else {
            for (let i=0; i < rels.length; i++) {
                const rel = rels[i];
                if (rel.getName() === "isOfDatatype") {
                    const proptype = rel.getToObject();
                    this.datatype = proptype.getName();
                    const dtype = glb.metis.findDatatypeByName(this.datatype);
                    if (utils.objExists(dtype))
                        this.datatypeRef = dtype.id;
                }
            }
        }
    }
}
*/
export class gqlRelationship {
    id:             string;
    name:           string;
    description:    string;
    typeRef:        string;
    fromobjectRef:  string;
    toobjectRef:    string;
    relshipviews:   gqlRelshipView[] | null;
    propvalues:     any[];
    deleted:        boolean;
    modified:       boolean;
    constructor(relship: akm.cxRelationship) {
        this.id             = relship.id;
        this.name           = relship.name;
        this.description    = relship.description;
        this.fromobjectRef  = relship.fromObject ? relship.fromObject.id : "";
        this.toobjectRef    = relship.toObject ? relship.toObject.id : "";
        this.typeRef        = "";
        this.relshipviews   = [];
        this.propvalues     = [];
        this.deleted        = relship.deleted;
        this.modified       = relship.modified;
        // Code
        if (relship) {
            if (relship.description)
                this.description = relship.description;
            const type = relship.type;
            if (type)
                this.typeRef = type.id;
            const fromObj = relship.fromObject;
            fromObj.addOutputrel(relship);
            const toObj = relship.toObject;
            toObj.addInputrel(relship);
            const relviews = relship.relshipviews;
            if (debug) console.log('875 gqlRelationship - relshipviews', relviews);
            if (relviews) {
                const cnt = relviews.length;
                for (let i = 0; i < cnt; i++) {
                    const relview = relviews[i];
                    this.addRelshipView(relview);
                }
            }
            const values = relship.valueset;
            if (values) {
                const cnt = values.length;
                for (let i = 0; i < cnt; i++) {
                    const val = values[i];
                    this.addPropertyValue(val);
                }
            }
        }
    }
    addRelshipView(relview: akm.cxRelationshipView) {
        if (relview) {
            const gRelview = new gqlRelshipView(relview);
            this.relshipviews.push(gRelview);
        }
    }
    addPropertyValue(val: akm.cxPropertyValue) {
        if (utils.objExists(val)) {
            const gPropval = new gqlPropertyValue(val);
            this.propvalues.push(gPropval);
        }
    }
}
export class gqlPropertyValue {
    property:   akm.cxProperty;
    value:      akm.cxValue;
    constructor(propval: akm.cxPropertyValue) {
        this.property   = propval.property;
        this.value      = propval.value;
    }
}
export class gqlModelView {
    id:                 string;
    name:               string;
    description:        string;
    modelRef:           string;
    objectviews:        gqlObjectView[];
    relshipviews:       gqlRelshipView[];
    objecttypeviews:    gqlObjectTypeView[];
    relshiptypeviews:   gqlRelshipTypeView[];
    deleted:            boolean;
    modified:           boolean;
    constructor(mv: akm.cxModelView) {
        this.id                 = mv?.id;
        this.name               = mv?.getName();
        this.description        = mv.description ? mv.description : "";
        this.modelRef           = mv?.getModel()?.id;
        this.objectviews        = [];
        this.relshipviews       = [];
        this.objecttypeviews    = [];
        this.relshiptypeviews   = [];
        this.deleted            = mv?.deleted;
        this.modified           = mv?.modified;
        // Code
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
            const gObjectView = new gqlObjectView(objview);
            this.objectviews.push(gObjectView);
        }
    }
    addRelshipView(relview: akm.cxRelationshipView) {
        if (relview && relview.relship && relview.fromObjview && relview.toObjview) {
            const gRelshipView = new gqlRelshipView(relview);
            this.relshipviews.push(gRelshipView);
        }
    }
    addObjectTypeView(objtypeview: akm.cxObjectTypeView) {
        if (objtypeview) {
            const gObjectTypeView = new gqlObjectTypeView(objtypeview);
            this.objecttypeviews.push(gObjectTypeView);
        }
    }
    addRelshipTypeView(reltypeview: akm.cxRelationshipTypeView) {
        if (reltypeview) {
            const gRelshipTypeView = new gqlRelshipTypeView(reltypeview);
            this.relshiptypeviews.push(gRelshipTypeView);
        }
    }
}
export class gqlObjectView {
    id:             string;
    name:           string;
    description:    string;
    objectRef:      string;
    typeviewRef:    string;
    group:          string;
    isGroup:        boolean;
    loc:            string;
    size:           string;
    deleted:        boolean;
    modified:       boolean;
    constructor(objview: akm.cxObjectView) {
        this.id             = objview?.id;
        this.name           = objview?.name;
        this.description    = objview?.description;
        this.objectRef      = "";
        this.typeviewRef    = "";
        this.group          = objview?.group;
        this.isGroup        = objview?.isGroup;
        this.loc            = objview?.loc;
        this.size           = objview?.size;
        this.deleted        = objview?.deleted;
        this.modified       = objview?.modified;
        // Code
        const obj = objview?.object;
        if (obj) {
            this.objectRef = obj?.id;
            obj.addObjectView(objview);
        }
        const typeview = objview?.typeview;
        if (typeview)
            this.typeviewRef = typeview?.id;
    }
}
export class gqlRelshipView {
    id:             string;
    name:           string;
    description:    string;
    relshipRef:     string;
    typeviewRef:    string;
    fromobjviewRef: string;
    toobjviewRef:   string;
    deleted:        boolean;
    modified:       boolean;
    constructor(relview: akm.cxRelationshipView) {
        this.id             = relview.id;
        this.name           = relview.name;
        this.description    = "";
        this.relshipRef     = "";
        this.typeviewRef    = "";
        this.fromobjviewRef = relview && relview.fromObjview ? relview.fromObjview.id : "";
        this.toobjviewRef   = relview && relview.toObjview ? relview.toObjview.id : "";
        this.deleted        = relview.deleted;
        this.modified       = relview.modified;
        // Code
        if (relview.description)
            this.description = relview.description;
        const relship = relview.relship;
        if (relship) {
            this.relshipRef = relship.id;
            relship.addRelationshipView(relview);
        }
        const typeview = relview.typeview;
        if (typeview)
            this.typeviewRef = typeview.id;
    }
}
export class gqlImportMetis {
    repositories:               akm.cxRepository[];
    metamodels:                 akm.cxMetaModel[];
    models:                     akm.cxModel[];
    currentRepositoryRef:       string;
    currentMetamodelRef:        string;
    currentModelRef:            string;
    currentModelviewRef:        string;
    currentTemplateModelRef:    string;
    pasteViewsOnly:             boolean;
    deleteViewsOnly:            boolean;
    imported:                   any;
    constructor(metis: akm.cxMetis, importedData: any) {
        this.repositories           = [];
        this.metamodels             = [];
        this.models                 = [];
        this.imported               = importedData;
        this.pasteViewsOnly         = importedData.pasteViewsOnly;
        this.deleteViewsOnly        = importedData.deleteViewsOnly;
        this.currentRepositoryRef   = importedData.currentRepositoryRef;
        this.currentMetamodelRef    = importedData.currentMetamodelRef;
        this.currentModelRef        = importedData.currentModelRef;
        this.currentModelviewRef    = importedData.currentModelviewRef;
        this.currentTemplateModelRef = importedData.currentTemplateModelRef;
    
        /* Initialise
        glb.metis.initMetis();
        glb.myMetamodel = undefined;
        glb.myModel     = undefined;
        */
        // Handle repositories
       const repositories = importedData.repositories;
       if (repositories && (repositories.length > 0)) {
           repositories.forEach(function (this: gqlImportMetis, repository: akm.cxModel) {
               this?.importRepository(repository);
           });
       }
        // Handle metamodels
        const metamodels = importedData.metamodels;
        if (metamodels && (metamodels.length > 0)) {
            metamodels.forEach(function (this: gqlImportMetis, metamodel: akm.cxMetaModel) {
                if (debug) console.log('834 importMetamodel', metamodel);
                this?.importMetamodel(metamodel);
            });
        }
        // Handle models 
        const models = importedData.models;
        if (models && (models.length > 0)) {
            models.forEach(function (this: gqlImportMetis, model: akm.cxModel) {
                this?.importModel(model);
            });
        }
    }
    importRepository(item: akm.cxRepository) {
        let repository = glb.metis.findRepository(item.id);
        if (!repository) {
            repository = new akm.cxRepository(item.id, item.name, item.description);
            glb.metis.addRepository(repository);
        }
    }
    importMetamodel(item: akm.cxMetaModel) {
        if (debug) console.log('1001 importMetis - glb.metis', glb.metis);
        let metamodel = glb.metis.findMetamodel(item.id);
        if (!metamodel) {
            metamodel = new akm.cxMetaModel(item.id, item.name, item.description);
            glb.metis.addMetamodel(metamodel);
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
        if (debug) console.log('1096 importObjectType - glb.metis', glb.metis);
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
            const objtypeview = glb.metis.findObjectTypeView(item.typeviewRef);
            if (objtype && objtypeview)
                objtype.setDefaultTypeView(objtypeview);
        }
        glb.metis.addObjectType(objtype);
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
            const fromobjType = glb.metis.findObjectType(item.fromobjtypeRef);
            const toobjType = glb.metis.findObjectType(item.toobjtypeRef);
            if (reltype) reltype.setFromObjtype(fromobjType);
            if (reltype) reltype.setToObjtype(toobjType);
        }
        if (utils.objExists(item.typeviewRef)) {
            const reltypeview = glb.metis.findRelationshipTypeView(item.typeviewRef);
            if (reltype && reltypeview)
                reltype.setDefaultTypeView(reltypeview);
        }
        glb.metis.addRelationshipType(reltype);
        if (reltype) metamodel.addRelationshipType(reltype);
        if (debug) console.log("Importing relshiptype: " + item.id + ", " + item.name);
        const properties = item.properties;
        if (utils.objExists(properties) && (properties.length > 0)) {
            properties.forEach(function (this: gqlImportMetis, prop: akm.cxProperty) {
                this.importProperty(prop, metamodel);
            });
        }
    }
    importObjectTypeView(item: any, metamodel: akm.cxMetaModel) {
        const typeref = item.typeRef;
        const type = glb.metis.findObjectType(typeref);
        const objtypeview = new akm.cxObjectTypeView(item.id, item.name, type, item.description);
        if (utils.objExists(type))
            objtypeview.setType(type);
        objtypeview.setFigure(item.figure);
        objtypeview.setFillcolor(item.fillcolor);
        objtypeview.setStrokecolor(item.strokecolor);
        objtypeview.setStrokewidth(item.strokewidth);
        objtypeview.setIcon(item.icon);
        glb.metis.addObjectTypeView(objtypeview);
        metamodel.addObjectTypeView(objtypeview);
        if (debug) console.log("Importing objtypeview: " + item.id + ", " + item.name);
    }
    importObjectTypegeo(item: any, metamodel: akm.cxMetaModel) {
        let typeref = item.typeRef;
        let type = glb.metis.findObjectType(typeref);
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
            glb.metis.addObjtypeGeo(objtypegeo);
            metamodel.addObjtypeGeo(objtypegeo);
        }
    }
    importRelshipTypeView(item: any, metamodel: akm.cxMetaModel) {
        const typeref = item.typeRef;
        const type = glb.metis.findRelationshipType(typeref);
        const reltypeview = new akm.cxRelationshipTypeView(item.id, item.name, type, item.description);
        if (utils.objExists(type))
            reltypeview.setType(type);
        reltypeview.setStrokecolor(item.strokecolor);
        reltypeview.setStrokewidth(item.strokewidth);
        reltypeview.setDash(item.dash);
        reltypeview.setFromArrow(item.fromarrow);
        reltypeview.setToArrow(item.toarrow);
        glb.metis.addRelationshipTypeView(reltypeview);
        metamodel.addRelationshipTypeView(reltypeview);
        if (debug) console.log("Importing reltypeview: " + item.id + ", " + item.name);
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
        glb.metis.addProperty(property);
        if (property) metamodel.addProperty(property);
        // type.addProperty(property);
    }
    importDatatype(item: any, metamodel: akm.cxMetaModel) {
        let dtype = glb.metis.findDatatype(item.id);
        if (!utils.objExists(dtype)) {
            dtype = new akm.cxDatatype(item.id, item.name, item.description);
        }
        // Eventually add datatype and unit
        glb.metis.addDatatype(dtype);
        metamodel.addDatatype(dtype);
    }
    importModel(item: any) {
        const metamodel = glb.metis.findMetamodel(item.metamodelRef);
        const model = new akm.cxModel(item.id, item.name, metamodel, item.description);
        model.setMetamodel(metamodel);
        glb.metis.addModel(model);
        if (debug) console.log("Importing model: " + item.id + ", " + item.name);
        const objects = item.objects;
        if (utils.objExists(objects) && (objects.length > 0)) {
            objects.forEach(function (this: gqlImportMetis, obj: akm.cxObject) {
                this.importObject(obj, model);
            });
        }
        const relships = item.relships;
        if (utils.objExists(relships) && (relships.length > 0)) {
            relships.forEach(function (this: gqlImportMetis, rel: akm.cxRelationship) {
                this.importRelship(rel, model);
            });
        }
        const modelviews = item.modelviews;
        if (utils.objExists(modelviews) && (modelviews.length > 0)) {
            modelviews.forEach(function (this: gqlImportMetis, mv: akm.cxModelView) {
                this.importModelView(mv, model);
            });
        }
    }
    importObject(item: any, model: akm.cxModel) {
        if (utils.objExists(item.typeRef)) {
            const objtype = glb.metis.findObjectType(item.typeRef);
            if (utils.objExists(objtype)) {
                let obj = new akm.cxObject(item.id, item.name, objtype, item.description);
                obj.setType(objtype);
                glb.metis.addObject(obj);
                model.addObject(obj);
                if (debug) console.log("Importing object: " + item.id + ", " + item.name);
            }
        }
    }
    importRelship(item: any, model: akm.cxModel) {
        if (utils.objExists(item.typeRef)) {
            const reltype = glb.metis.findRelationshipType(item.typeRef);
            const fromObj = glb.metis.findObject(item.fromObjectRef);
            const toObj = glb.metis.findObject(item.toObjectRef);
            if (reltype && fromObj && toObj) {
                const rel = new akm.cxRelationship(item.id, item.name, reltype, fromObj, toObj, item.description);
                rel.setType(reltype);
                glb.metis.addRelationship(rel);
                model.addRelationship(rel);
                if (debug) console.log("Importing relship: " + item.id + ", " + item.name);
            }
        }
    }
    importModelView(item: akm.cxModelView, model: akm.cxModel) {
        const modelview = new akm.cxModelView(item.id, item.name, model, item.description);
        if (utils.objExists(item.typeRef)) {
            const objtype = glb.metis.findObjectType(item.typeRef);
            if (utils.objExists(objtype))
                item.setType(objtype);
        }
        glb.metis.addModelView(modelview);
        model.addModelView(modelview);
        if (debug) console.log("Importing modelview: " + item.id + ", " + item.name);
        const objectviews = item.objectviews;
        objectviews.forEach(function (this: gqlImportMetis, objview: akm.cxObjectView) {
            this.importObjectView(objview, modelview);
        });
        const relshipviews = item.relshipviews;
        relshipviews.forEach(function (this: gqlImportMetis, relview: akm.cxRelationshipView) {
            this.importRelshipView(relview, modelview);
        });
    }
    importObjectView(item: akm.cxObjectView, modelview: akm.cxModelView) {
        if (item.objectRef) {
            const object = glb.metis.findObject(item.objectRef);
            if (object) {
                const objview = new akm.cxObjectView(item.id, item.name, object, item.description);
                objview.group = item.group;
                objview.isGroup = item.isGroup;
                objview.setObject(object);
                if (item.typeviewRef) {
                    const objtypeview = glb.metis.findObjectTypeView(item.typeviewRef);
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
        if (item.relshipRef) {
            const relship = glb.metis.findRelationship(item.relshipRef);
            if (relship) {
                const relview = new akm.cxRelationshipView(item.id, item.name, relship, item.description);
                relview.setRelationship(relship);
                const fromobjview: any = modelview.findObjectView(item.fromobjviewRef);
                const toobjview: any = modelview.findObjectView(item.toobjviewRef);
                relview.setFromObjectView(fromobjview);
                relview.setToObjectView(toobjview);
                // relview.setData(item.data);
                if (item.typeviewRef) {
                    const reltypeview = glb.metis.findRelationshipTypeView(item.typeviewRef);
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
export class gqlImportTypeDefinition {
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
            const objtypeview = glb.metis.findObjectTypeView(item.typeviewRef);
            if (objtype && objtypeview)
                objtype.setDefaultTypeView(objtypeview);
        }
        glb.metis.addObjectType(objtype);
        if (objtype) metamodel.addObjectType(objtype);
        if (debug) console.log("Importing objecttype: " + item.id + ", " + item.name);

    }
}
export class gqlObjtypePropertyDialog {
	id:					string;
	name:				string;
	description:		string;
	tabs:				any[];
	properties:			gqlPropertyDefinition[];
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

class gqlTab {
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
class gqlSection {
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