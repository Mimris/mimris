// Application code

//const glb 	= require('./akm_globals');
const constants = require('./constants');
//const goc = require('./gojs_constants');
const vkc = require('./viewkinds');

import * as utils from './utilities';
import * as akm from './metamodeller';

/*
Module:         Interface to GoJS
File name:      ui-gojs.js
Purpose:
Description:
Classes:
Functions:
*/

// ----------------------------------------------------------------------------------

export class goModel {
    key: string;
    name: string;
    modelView: akm.cxModelView;
    model: akm.cxModel | null;
    metamodel: akm.cxMetaModel | null;
    nodes: goNode[];
    links: goLink[];
    constructor(key: string, name: string, modelView: akm.cxModelView) {
        this.key = key;
        this.name = name;
        this.modelView = modelView;
        this.nodes = new Array();
        this.links = new Array();
        this.model = (modelView) ? modelView.model : null;
        this.metamodel = (modelView)
            ? ((modelView.model) ? (modelView.model.metamodel) : null)
            : null;
        // console.log('41 constants', constants);
    }
    // Methods
    getModelView() {
        return this.modelView;
    }
    getModel() {
        if (this.modelView)
            return this.modelView.model;
    }
    getMetamodel() {
        return this.metamodel;
    }
    setMetamodel(metamodel: akm.cxMetaModel) {
        this.metamodel = metamodel;
    }
    addNode(node: goObjectNode | goObjectTypeNode) {
        // Check if input is of correct class and not already in list (TBD)
        if ((node.class === "goObjectNode")
            || (node.class === "goObjectTypeNode")
            || (node.class === "goNode")
        ) {
            node.setParentModel(this);
            let oldNodes: goObjectNode[] = new Array();
            for (let i = 0; i < this.nodes.length; i++) {
                let n = this.nodes[i] as goObjectNode;
                oldNodes.push(n);
            }
            oldNodes.push(node as goObjectNode);
            this.nodes = oldNodes;
        }
    }
    addLink(link: goLink) {
        // Check if input is of correct class and not already in list (TBD)
        if ((link.class === "goRelshipLink") || (link.class === "goRelshipTypeLink")) {
            let oldLinks: goLink[] = new Array();
            for (let i = 0; i < this.links.length; i++) {
                let l = this.links[i] as goLink;
                oldLinks.push(l);
            }
            oldLinks.push(link as goLink);
            this.links = oldLinks;
        }
    }
    findNodeByViewId(objviewId: string): goObjectNode | null {
        const retval: goObjectNode | null = null;
        if (!utils.isArrayEmpty(this.nodes)) {
            let i = 0;
            while (i < this.nodes.length) {
                const node = this.nodes[i];
                if (node.class === 'goObjectNode') {
                    const n = node as goObjectNode;
                    if (n.objectview && n.objectview.getId() === objviewId) {
                        return (n);
                    }
                }
                i++;
            }
        }
        return retval;
    }
    findNode(key: string): goObjectNode | null {
        const retval: goObjectNode | null = null;
        if (!utils.isArrayEmpty(this.nodes)) {
            // console.log('103 findNode', key, this.nodes);
            let i = 0;
            while (i < this.nodes.length) {
                const node: goObjectNode = this.nodes[i] as goObjectNode;
                //console.log('108 findNode', key, node.key);
                if (node.key === key) {
                    return (node);
                }
                i++;
            }
        }
        return retval;
    }
    findTypeNode(objtypeId: string): goObjectTypeNode | null {
        let retval: goObjectTypeNode | null = null;
        if (!utils.isArrayEmpty(this.nodes)) {
            let i = 0;
            while (i < this.nodes.length) {
                const node: goObjectTypeNode = this.nodes[i] as goObjectTypeNode;
                if (node.getObjectTypeId() === objtypeId) {
                    retval = node;
                    break;
                }
                i++;
            }
        }
        return retval;
    }
    findGroup(groupKey: string) {
        const nodes = this.nodes;
        const cnt = nodes.length;
        for (let i = 0; i < cnt; i++) {
            const n = nodes[i];
            if (n.class === "goObjectNode") {
                const node = n as goObjectNode;
                if (!node.isGroup)
                    continue;
                const objview = node.objectview;
                if (objview && objview.getId() === groupKey)
                    return node;
            }
        }
        return null;
    }
    findLink(key: string): goLink | null {
        const retval: goLink | null = null;
        if (!utils.isArrayEmpty(this.links)) {
            let i = 0;
            while (i < this.links.length) {
                const link: goLink = this.links[i] as goLink;
                if (link.getKey() === key) {
                    return (link);
                }
                i++;
            }
        }
        return retval;
    }
    loadMetamodel(metamodel: akm.cxMetaModel) {
        if (utils.objExists(metamodel)) {
            this.metamodel = metamodel;
            if (metamodel.objecttypes) {
                const gMetamodel = new goModel(utils.createGuid(), metamodel.getName(), this.modelView);
                const objecttypes = metamodel.getObjectTypes();
                if (objecttypes) {
                    let i = 0;
                    let l = objecttypes.length;
                    for (i = 0; i < l; i++) {
                        const objtype = objecttypes[i];
                        if (utils.objExists(objtype)) {
                            if (!objtype.getDeleted()) {
                                const node = new goObjectTypeNode(utils.createGuid(), objtype);
                                node.loadNodeContent(metamodel);
                                gMetamodel.addNode(node);
                            }
                        }
                    }
                    const relshiptypes = metamodel.getRelshipTypes();
                    if (relshiptypes) {
                        i = 0;
                        l = relshiptypes ? relshiptypes.length : 0;
                        for (i = 0; i < l; i++) {
                            const reltype = relshiptypes[i];
                            if (reltype) {
                                if (!reltype.getDeleted()) {
                                    const key = utils.createGuid();
                                    const link = new goRelshipTypeLink(key, gMetamodel, reltype);
                                    if (link.loadLinkContent())
                                        gMetamodel.addLink(link);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

export class goMetaObject {
    key: string;
    class: string;
    name: string;
    category: string;
    type: any;
    parentModel: goModel | null;
    data: any;
    constructor(key: string) {
        this.class = this.constructor.name;
        this.parentModel = null;
        this.key = key;
        this.category = "default";
        this.type = null;
        this.name = "";
        this.data = new Array();
    }
    // Methods
    getClass() {
        return this.class;
    }
    getParentModel() {
        return this.parentModel;
    }
    setParentModel(model: goModel) {
        this.parentModel = model;
    }
    getKey(): string {
        return this.key;
    }
    setType(type: any) {
        this.type = type;
    }
    getType(): any {
        return this.type;
    }
    setName(name: string) {
        this.name = name;
    }
    getName(): string {
        return this.name;
    }
    addData(data: any) {
        extend(this, data);
    }
    getData(): any {
        return this.data;
    }
}

export class goNode extends goMetaObject {
    parentModel: goModel | null;
    loc: string;
    size: string;
    constructor(key: string, model: goModel | null) {
        super(key);
        this.class = 'goNode';
        this.parentModel = model;  // goModel
        this.loc = "";
        this.size = "";
    }
    // Methods
    setLoc(loc: string) {
        this.loc = loc;
    }
    getLoc(): string {
        return this.loc;
    }
    setSize(size: string) {
        this.size = size;
    }
    getSize(): string {
        return this.size;
    }
}

export class goObjectNode extends goNode {
    objectview: akm.cxObjectView | null;
    object: akm.cxObject | null;
    objecttype: akm.cxObjectType | null;
    typename: string;
    typeview: akm.cxObjectTypeView | null;
    isGroup: boolean | "";
    groupLayout: string;
    group: string;
    parent: string;
    choices: string[];
    constructor(key: string, objview: akm.cxObjectView) {
        super(key, null);
        this.class = 'goObjectNode';
        this.category = constants.gojs.C_OBJECT;
        this.objectview = objview;
        this.object = null;
        this.objecttype = null;
        this.typename = "";
        this.typeview = null;
        this.isGroup = objview.isGroup;
        this.groupLayout = "Tree";
        this.group = objview.group;
        this.parent = "";
        this.choices = [];

        if (objview) {
            const object = objview.getObject();
            if (object) {
                this.object = object;
                this.name = object.getName();
                if (object.getType()) {
                    this.objecttype = (object.getType() as akm.cxObjectType);
                    this.typename = this.objecttype.getName();
                    this.type = this.typename;
                } else {
                    this.objecttype = null;
                    this.typename = "";
                    this.type = "";
                }
            }
            this.typeview = objview.getTypeView();
            const modelView = objview.getParentModelView();
            const model = modelView?.getParentModel();
            const metamodel = model?.getMetamodel();

            const objtypes = metamodel?.getObjectTypes();
            if (objtypes) {
                for (let i=0; i<objtypes.length; i++) {
                    const objtype = objtypes[i];
                    if (!objtype.isAbstract())
                        this.choices.push(objtype.name);  
                }
                this.choices.sort();
            }
        }
        this.class = 'goObjectNode';
    }
    // Methods
    getObjectViewId(viewid: string): string {
        if (this.objectview)
            return this.objectview.getId();
        else return "";
    }
    loadNodeContent(model: goModel) {
        if (this.typeview) {
            const typeview: akm.cxObjectTypeView = this.typeview;
            const viewdata: any = typeview.getData();
            this.addData(viewdata);
            if (this.objectview) {
                const objviewId = this.objectview.group;
                if (objviewId !== "") {
                    const groupId: string = this.getGroupFromObjviewId(objviewId, model);
                    if (groupId !== "") {
                        this.group = groupId;
                    }
                }
                if (this.objectview.isGroup) {
                    this.isGroup = true;
                }
                // if (model && groupId.length>0) {
                //     const group: goNode | null  = model.findGroup(groupId);
                //     if (utils.objExists(group))
                //         this.group = (group) ? group.key : "";
                // }
                //console.log('312 objectview', this.objectview);
                this.setName(this.objectview.getName());
                this.setLoc(this.objectview.getLoc());
                this.setSize(this.objectview.getSize());
                //console.log('315 goObjectNode', this);
                return true;
            }
        }
        return false;
    }
    updateNode(data: any, diagram: any) {
        if (this.typeview) {
            const viewdata = this.typeview.getData();
            let data = (viewdata as any);
            let prop: string;
            for (prop in data) {
                if (data[prop] != null)
                    diagram.model.setDataProperty(data, prop, data[prop]);
            }
        }
    }
    getGroupFromObjviewId(objviewId: string, model: goModel): string {
        // Loop through nodes to find object view
        const nodes = model.nodes;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i] as goObjectNode;
            let objview = node.objectview;
            if (objview) {
                if (objview.id === objviewId) {
                    return node.key;
                }
            }
        }
        return "";
    }
}

export class goObjectTypeNode extends goNode {
    objtype: akm.cxObjectType | null;
    typeview: akm.cxObjectTypeView | akm.cxRelationshipTypeView | null;
    typename: string;
    choices: string[];
    constructor(key: string, objtype: akm.cxObjectType) {
        super(key, null);
        this.class = 'goObjectTypeNode';
        this.category = constants.gojs.C_OBJECTTYPE;
        this.objtype = objtype;
        this.typeview = null;
        this.typename = constants.gojs.C_OBJECTTYPE;
        // this.isGroup    = false;
        this.choices = ['Edit name'];

        if (objtype) {
            this.setName(objtype.name);
            this.setType(constants.gojs.C_OBJECTTYPE);
            const typeview = objtype.getDefaultTypeView();
            if (utils.objExists(typeview)) {
                this.typeview = typeview;
                // this.isGroup  = objtype.isContainer();
            }
        }
    }
    // Methods
    getObjectTypeId(): string {
        if (this.objtype)
            return this.objtype.getId();
        else
            return "";
    }
    loadNodeContent(metamodel: akm.cxMetaModel | null) {
        if (this.objtype) {
            const objtype = this.objtype;
            if (!objtype.deleted) {
                const typeview = this.typeview;
                if (typeview) {
                    const data = typeview.getData();
                    this.addData(data);
                    this.setName(objtype.getName());
                    this.setType(constants.gojs.C_OBJECTTYPE);
                    if (!metamodel) {
                        let model = this.parentModel;
                        metamodel = model ? model.metamodel : null;
                    }
                    if (metamodel) {
                        let loc = objtype.getLoc(metamodel)
                        this.setLoc(loc);
                        let size = objtype.getSize(metamodel);
                        this.setSize(size);
                    }
                }
            }
            return true;
        }
        return false;
    }
    updateNode(data: any, diagram: any) {
        if (this.typeview) {
            const viewdata = this.typeview.getData();
            let data = (viewdata as any);
            let prop: string;
            for (prop in data) {
                if (data[prop] != null)
                    diagram.model.setDataProperty(data, prop, data[prop]);
            }
        }
    }
}

export class goLink extends goMetaObject {
    parentModel: goModel;
    constructor(key: string, model: goModel) {
        super(key);
        this.class = 'goLink';
        this.parentModel = model;  // goModel
    }
    // Methods
}

export class goRelshipLink extends goLink {
    relshipview: akm.cxRelationshipView | null;
    relship: akm.cxRelationship | null;
    relshiptype: akm.cxObjectType | akm.cxRelationshipType | null;
    typename: string;
    typeview: akm.cxRelationshipTypeView | null;
    fromNode: goObjectNode | null;
    toNode: goObjectNode | null;
    from: string;
    to: string;
    choices: string[];
    constructor(key: string, model: goModel, relview: akm.cxRelationshipView) {
        super(key, model);
        this.class = 'goRelshipLink';
        this.category = constants.gojs.C_RELATIONSHIP;
        this.relshipview = relview;
        this.relship = null;
        this.relshiptype = null;
        this.typename = "";
        this.typeview = null;
        this.fromNode = null;
        this.toNode = null;
        this.from = "";
        this.to = "";
        this.choices = [];

        if (relview) {
            const metis = relview.metis;
            const relship = relview.relship;
            if (relship) {
                this.relship = relship;
                this.relshiptype = relship.getType();
                // this.typename    = this.relshiptype.getName();
                this.type = this.typename;
                this.name = this.relship.getName();
                if (this.name.length == 0)
                    this.name = this.typename;
            }
            this.typeview = relview.typeview;
            const fromObjview = relview.fromObjview;
            if (fromObjview) {
                let node: goNode | null = model.findNodeByViewId(fromObjview.id);
                if (node) {
                    this.fromNode = node as goObjectNode;
                    this.from = node.key;
                    const fromType = this.fromNode.objecttype;
                    const toObjview: akm.cxObjectView | null = relview.toObjview;
                    if (toObjview) {
                        node = model.findNodeByViewId(toObjview.id);
                        if (node) {
                            this.toNode = node as goObjectNode;
                            this.to = node.key;
                            const toType = this.toNode.objecttype;
                            if (fromType && toType) {
                                const reltypes = metis.findRelationshipTypesBetweenTypes(fromType, toType);
                                if (reltypes) {
                                    for (let i=0; i<reltypes.length; i++) {
                                        const reltype = reltypes[i];
                                        this.choices.push(reltype.name);  
                                    }
                                    this.choices.sort();
                                }
                            }
                        }                        
                    }
                }
            }
        }
        // console.log('538 goRelshipLink', this.choices);
    }
    // Methods
    getRelshipView(): akm.cxRelationshipView | null {
        return this.relshipview;
    }
    getFromNode(): goNode | null {
        return this.fromNode;
    }
    setFromNode(from: string) {
        this.from = from;
    }
    getToNode(): goNode | null {
        return this.toNode;
    }
    setToNode(to: string) {
        this.to = to;
    }
    getRelshipKind(): string {
        const typeview: akm.cxRelationshipTypeView | null = this.typeview;
        if (typeview) {
            return typeview.getRelshipKind();
        } else
            return "";
    }
    loadLinkContent(model: goModel) {
        const relview: akm.cxRelationshipView | null = this.relshipview;
        const typeview: akm.cxRelationshipTypeView | null = this.typeview;
        if ((relview) && (typeview)) {
            if (!relview.deleted) {
                if (this.toNode && this.fromNode) {
                    const viewdata: any = typeview.getData();
                    this.addData(viewdata);
                    this.setName(relview.getName());
                    console.log('584 loadLinkContent', this);
                }
            }
        } else if (relview) {
            const relship: akm.cxRelationship | null = relview.relship;
            if (relship && (relship.category === constants.gojs.C_OBJECT)) {
                if (relship.viewkind === vkc.VIEWKINDS.REL) {
                    const reltype = relship.type;
                    if (reltype) {
                        if (reltype.typeview) {
                            const data: any = reltype.typeview.data;
                            this.addData(data);
                            this.setName(relview.getName());
                        }
                    }
                }
            }
        }
    }
    updateLink(data: any, diagram: any) {
        if (this.typeview) {
            const viewdata = this.typeview.getData();
            let data = (viewdata as any);
            let prop: string;
            for (prop in data) {
                if (data[prop] != null)
                    diagram.model.setDataProperty(data, prop, data[prop])
            }
        }
    }
}

export class goRelshipTypeLink extends goLink {
    reltype:    akm.cxRelationshipType | null;
    typeview:   akm.cxObjectTypeView | akm.cxRelationshipTypeView | null;
    fromNode:   goNode | null;
    toNode:     goNode | null;
    from:       string | undefined;
    to:         string | undefined;
    choices:    string[];
    constructor(key: string, model: goModel, reltype: akm.cxRelationshipType | null) {
        super(key, model);
        this.class = 'goRelshipTypeLink';
        this.category   = constants.gojs.C_RELSHIPTYPE;
        this.reltype    = reltype;
        this.typeview   = null;
        this.fromNode   = null;
        this.toNode     = null;
        this.from       = "";
        this.to         = "";
        this.choices    = ['Edit name'];

        if (reltype) {
            this.setName(reltype.getName());
            this.setType(constants.gojs.C_RELSHIPTYPE);
            const typeview: akm.cxObjectTypeView | akm.cxRelationshipTypeView | null
                = reltype.getDefaultTypeView();
            if (typeview) {
                this.typeview = typeview;
                const fromObjtype: akm.cxObjectType | null = reltype.getFromObjType();
                if (fromObjtype) {
                    this.fromNode = model.findTypeNode(fromObjtype.getId());
                    this.from = this.fromNode?.key;
                    const toObjtype: akm.cxObjectType | null = reltype.getToObjType();
                    if (toObjtype) {
                        this.toNode = model.findTypeNode(toObjtype.getId());
                        this.to = this.toNode?.key;
                    }
                }
            }
        }
    }

    // Methods
    getTypeView() {
        return this.typeview;
    }
    getFromNode() {
        return this.fromNode;
    }
    setFromNode(from: goNode | null) {
        this.fromNode = from;
    }
    getToNode() {
        return this.toNode;
    }
    setToNode(to: goNode | null) {
        this.toNode = to;
    }
    loadLinkContent() {
        if (this.reltype) {
            if (this.reltype.deleted === false) {
                if (utils.objExists(this.toNode) && utils.objExists(this.fromNode)) {
                    const typeview: akm.cxObjectTypeView | akm.cxRelationshipTypeView | null = this.typeview;
                    if (typeview) {
                        const data: any = typeview.getData();
                        this.addData(data);
                        this.setName(this.reltype.getName());
                        return true;
                    }
                }
            }
        }
        return false;
    }
    updateLink(data: any, diagram: any) {
        if (this.typeview) {
            const viewdata: any = this.typeview.getData();
            let prop: string;
            for (prop in viewdata) {
                if (viewdata[prop] != null)
                    diagram.model.setDataProperty(data, prop, viewdata[prop])
            }
        }
    }
}

// ----------------------------------------------------------------------------------

export function extend(target: any, source: any) {
    let prop: string;
    for (prop in source) {
        if (prop === 'class') continue;
        target[prop] = source[prop];
    }
}

// ----------------------------------------------------------------------------------

export class paletteNode {
    key: string;
    type: any;
    category: string;
    viewkind: string;
    abstract: boolean;
    name: string;
    description: string;
    isGroup: boolean;
    figure: string;
    fillcolor: string;
    strokecolor: string;
    strokewidth: string;
    icon: string;
    constructor(key: string, type: any, category: string, name: string, description: string) {
        this.key = key;
        this.type = type;
        this.category = category;
        this.viewkind = "Object";
        this.abstract = false;
        this.name = name;
        this.description = description;
        this.isGroup = false;
        this.figure = "RoundedRectangle";
        this.fillcolor = "lightyellow";
        this.strokecolor = "black";
        this.strokewidth = "1";
        this.icon = "";
    }
}
