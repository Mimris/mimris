// @ts-nocheck
// Application code
const debug = false;

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
    layout: string;
    layer: string;
    visible: boolean;
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
        this.layout = "";
        this.layer = this.model?.layer;
        this.visible = this.layer !== 'Admin';
        if (debug) console.log('41 constants', constants, this);
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
        node.setParentModel(this);
        let oldNodes: goObjectNode[] = new Array();
        for (let i = 0; i < this.nodes?.length; i++) {
            let n = this.nodes[i] as goObjectNode;
            oldNodes.push(n);
        }
        oldNodes.push(node as goObjectNode);
        this.nodes = oldNodes;
    }
    addLink(link: goLink) {
        let oldLinks: goLink[] = new Array();
        for (let i = 0; i < this.links.length; i++) {
            let l = this.links[i] as goLink;
            oldLinks.push(l);
        }
        oldLinks.push(link as goLink);
        this.links = oldLinks;
    }
    findNodeByViewId(objviewId: string): goObjectNode | null {
        const retval: goObjectNode | null = null;
        if (!utils.isArrayEmpty(this.nodes)) {
            let i = 0;
            while (i < this.nodes?.length) {
                const node = this.nodes[i];
                const n = node as goObjectNode;
                const objview = n.objectview as akm.cxObjectView;
                if (objview && objview.id === objviewId) {
                    return (n);
                }
                i++;
            }
        }
        return retval;
    }
    findNodeByObjectId(objId: string): goObjectNode | null {
        const retval: goObjectNode | null = null;
        if (!utils.isArrayEmpty(this.nodes)) {
            let i = 0;
            while (i < this.nodes?.length) {
                const node = this.nodes[i];
                const n = node as goObjectNode;
                if (n.object && n.object.id === objId) {
                    return (n);
                }
                i++;
            }
        }
        return retval;
    }
    findNode(key: string): goObjectNode | null {
        const retval: goObjectNode | null = null;
        if (!utils.isArrayEmpty(this.nodes)) {
            let i = 0;
            while (i < this.nodes?.length) {
                const node: goObjectNode = this.nodes[i] as goObjectNode;
                if (node.getKey() === key) {
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
            while (i < this.nodes?.length) {
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
        const cnt = nodes?.length;
        for (let i = 0; i < cnt; i++) {
            const n = nodes[i];
            const node = n as goObjectNode;
            if (!node.isGroup)
                continue;
            const objview = node.objectview;
            if (objview && objview.id === groupKey)
                return node;
        }
        return null;
    }
    findLink(key: string): goLink | null {
        const retval: goLink | null = null;
        if (!utils.isArrayEmpty(this.links)) {
            let i = 0;
            while (i < this.links.length) {
                const link: goLink = this.links[i] as goLink;
                if (link.key === key) {
                    return (link);
                }
                i++;
            }
        }
        return retval;
    }
    findLinkByViewId(relviewId: string): goRelshipLink | null {
        const retval: goRelshipLink | null = null;
        if (!utils.isArrayEmpty(this.links)) {
            let i = 0;
            while (i < this.links.length) {
                const link = this.links[i];
                const l = link as goRelshipLink;
                if (l.relshipview && l.relshipview.id === relviewId) {
                    return (l);
                }
                i++;
            }
        }
        return retval;
    }
    updateNode(node: goObjectNode) {
        const nodes = this.nodes;
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            if (n.key === node.key) {
                for (let k in n ) {
                    if (typeof k === 'string') {
                        if (node[k] !== n[k])
                            n[k] = node[k];
                    }
                }
                break;
            }
        }
    }
    updateTypeNode(node: goObjectTypeNode) {
        const nodes = this.nodes;
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            if (n.key === node.key) {
                nodes[i] = node;
                break;
            }
        }
    }
    updateLink(link: goRelshipLink) {
        const links = this.links;
        for (let i = 0; i < links.length; i++) {
            const l = links[i];
            if (l.key === link.key) {
                links[i] = link;
                break;
            }
        }
    }
    updateTypeLink(link: goRelshipTypeLink) {
        const links = this.links;
        for (let i = 0; i < links.length; i++) {
            const l = links[i];
            if (l.key === link.key) {
                links[i] = link;
                break;
            }
        }
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
                            if (!objtype.getMarkedAsDeleted()) {
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
                                if (!reltype.getMarkedAsDeleted()) {
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
    name: string;
    category: string;
    type: any;
    parentModel: goModel | null;
    data: any;
    constructor(key: string) {
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
    text:            string;
    loc:             string;
    size:            string;
    strokecolor:     string;
    fillcolor:       string;
    markedAsDeleted: boolean;
    constructor(key: string, model: goModel | null) {
        super(key);
        this.parentModel = model;  // goModel
        this.text = "";
        this.loc = "";
        this.size = "";
        this.strokecolor = "";
        this.fillcolor = "";
        this.markedAsDeleted = false;
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
    //objectview_0: akm.cxObjectView | null;
    object: akm.cxObject | null;
    objecttype: akm.cxObjectType | null;
    typename: string;
    typeview: akm.cxObjectTypeView | null;
    template: string;
    geometry: string;
    fillcolor: string;
    strokecolor: string;
    strokewidth: string;
    textcolor: string;
    icon: string;
    isGroup: boolean | "";
    isCollapsed: boolean | "";
    groupLayout: string;
    group: string;
    parent: string;
    constructor(key: string, objview: akm.cxObjectView) {
        super(key, null);
        this.category       = constants.gojs.C_OBJECT;
        this.objectview     = objview;
        this.object         = null;
        this.objecttype     = null;
        this.typename       = "";
        this.template       = objview.template;
        this.geometry       = objview.geometry;
        this.fillcolor      = objview.fillcolor;
        this.strokecolor    = objview.strokecolor;
        this.strokewidth    = objview.strokewidth;
        this.textcolor      = objview.textcolor;
        this.icon           = objview.icon;
        this.isGroup        = objview.isGroup;
        this.isCollapsed    = objview.isCollapsed;
        this.groupLayout    = "Tree";
        this.group          = objview.group;
        this.parent         = "";

        if (objview) {
            const object = objview.getObject();
            if (object) {
                this.object = object;
                this.name = object.getName();
                if (object.getType()) {
                    this.objecttype = (object.getType() as akm.cxObjectType);
                    this.typename = this.objecttype.getName();
                    //this.type = this.typename;
                } else {
                    this.objecttype = null;
                    this.typename = "";
                    //this.type = "";
                }

            }
            this.typeview = objview.getTypeView();
            this.template = this.typeview.template;
            this.geometry = this.typeview.geometry;
        }
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
                const objview = this.objectview;
                for (let prop in viewdata) {
                    if (objview[prop] && objview[prop] !== "") {
                        this[prop] = objview[prop];
                    }
                }
                // Handle groups
                // If objectview refers to a group, 
                //     find the corresponding node's group reference    
                const groupId = this.objectview.group;
                if (groupId !== "") {
                    const nodeGroupId: string = this.getGroupFromObjviewId(groupId, model);
                    if (nodeGroupId !== "") {
                        this.group = nodeGroupId;
                    }
                }
                // Do the same for the isGroup attribute
                if (this.objectview.isGroup) {
                    this.isGroup = true;
                }
                this.setName(this.objectview.getName());
                this.setLoc(this.objectview.getLoc());
                this.setSize(this.objectview.getSize());
                if (debug) console.log('415 goObjectNode', this);
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
        for (let i = 0; i < nodes?.length; i++) {
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
    getGroupMembers(model: goModel): goObjectNode[] {
        if (!this.isGroup)
            return null;
        const members = new Array();
        const groupId = this.key;
        const nodes = model.nodes;
        for (let i=0; i<nodes.length; i++) {
            const node = nodes[i] as goObjectNode;
            if (node.group === groupId) {
                members.push(node);
            }
        }
        return members;
    }
    getGroupMembers2(model: goModel): akm.cxObjectView[] {
        if (!this.isGroup)
            return null;
        const members = new Array();
        const groupId = this.key;
        const nodes = model.nodes;
        for (let i=0; i<nodes.length; i++) {
            const node = nodes[i] as goObjectNode;
            if (node.group === groupId) {
                members.push(node.objectview);
            }
        }
        return members;
    }
    getGroupLinkMembers(model: goModel): goRelshipLink[] {
        if (!this.isGroup)
            return null;
            const groupId = this.key;
            const members = new Array();
            const links = model.links as goRelshipLink[];
            for (let i=0; i<links.length; i++) {
                const link = links[i] as goRelshipLink;
                const fromNode = link.fromNode as goObjectNode;
                const toNode = link.toNode as goObjectNode;
                if (debug) console.log('488 groupId, nodes', groupId, fromNode, toNode);
                if (fromNode.group === groupId && toNode.group === groupId) {
                    members.push(link);
                }
            }
            return members;
    }
    getGroupLinkMembers2(model: goModel): akm.cxRelationshipView[] {
        if (!this.isGroup)
            return null;
        const groupId = this.key;
        const members = new Array();
        const links = model.links as goRelshipLink[];
        for (let i=0; i<links.length; i++) {
            const link = links[i] as goRelshipLink;
            const fromNode = link.fromNode as goObjectNode;
            const toNode = link.toNode as goObjectNode;
            if (debug) console.log('501 groupId, nodes', groupId, fromNode, toNode);
            if (fromNode?.group === groupId && toNode?.group === groupId) {
                const relview = link.relshipview;
                members.push(relview);
            }
        }
        return members;
    }
}

export class goObjectTypeNode extends goNode {
    objecttype: akm.cxObjectType | null;
    typeview: akm.cxObjectTypeView | akm.cxRelationshipTypeView | null;
    typename: string;
    constructor(key: string, objtype: akm.cxObjectType) {
        super(key, null);
        this.category = constants.gojs.C_OBJECTTYPE;
        this.objecttype = objtype;
        this.typeview = null;
        this.typename = constants.gojs.C_OBJECTTYPE;
        
        if (debug) console.log('416 this', this);
        if (objtype) {
            this.setName(objtype.getName());
            this.setType(constants.gojs.C_OBJECTTYPE);
            const typeview = objtype.getDefaultTypeView();
            if (typeview) {
                this.typeview = typeview;
            }
        }
    }
    // Methods
    getObjectTypeId(): string {
        if (this.objecttype)
            return this.objecttype.getId();
        else
            return "";
    }
    loadNodeContent(metamodel: akm.cxMetaModel | null) {
        if (this.objecttype) {
            const objtype = this.objecttype;
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
            if (debug) console.log('455 loadNodeContent', this);
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
    markedAsDeleted: boolean;
    constructor(key: string, model: goModel) {
        super(key);
        this.parentModel = model;  // goModel
        this.markedAsDeleted = false;
    }
    // Methods
}

export class goRelshipLink extends goLink {
    relshipview:        akm.cxRelationshipView | null;
    relship:            akm.cxRelationship | null;
    relshiptype:        akm.cxObjectType | akm.cxRelationshipType | null;
    typename:           string;
    typeview:           akm.cxRelationshipTypeView | null;
    template:           string;
    fromNode:           goNode | null;
    toNode:             goNode | null;
    from:               string;
    to:                 string;
    strokecolor:        string;
    textcolor:          string;
    fromArrow:          string;
    toArrow:            string;
    fromArrowColor:     string;
    toArrowColor:       string;
    routing:            string;
    curve:              string;
    points:             any;
    cardinality:        string;
    cardinalityFrom:    string;
    cardinalityTo:      string;
    nameFrom:           string;
    nameTo:             string;
    constructor(key: string, model: goModel, relview: akm.cxRelationshipView) {
        super(key, model);
        this.category        = constants.gojs.C_RELATIONSHIP;
        this.relshipview     = relview;
        this.relship         = null;
        this.relshiptype     = null;
        this.typename        = "";
        this.typeview        = null;
        this.fromNode        = null;
        this.toNode          = null;
        this.from            = "";
        this.to              = "";
        this.template        = "";
        this.strokecolor     = "";
        this.textcolor       = "";
        this.fromArrow       = "";
        this.fromArrowColor  = "";
        this.toArrow         = "";
        this.toArrowColor    = "";
        this.routing         = "";
        this.curve           = "";
        this.points          = null;
        this.cardinality     = "";
        this.cardinalityFrom = "";
        this.cardinalityTo   = "";
        this.nameFrom        = "";
        this.nameTo          = "";

        if (relview) {
            const relship = relview.getRelationship();
            if (relship) {
                this.relship = relship;
                this.relshiptype = relship.type;
                // this.typename    = this.relshiptype.getName();
                this.type = this.typename;
                this.name = this.relship.name;
                if (this.name.length == 0)
                    this.name = this.typename;
                this.cardinalityFrom = this.relship.cardinalityFrom;
                this.cardinalityTo = this.relship.cardinalityTo;
                this.nameFrom = this.relship.nameFrom;
                this.nameTo = this.relship.nameTo;
                if (debug) console.log('629 relshipLink', this);
            }
            this.typeview = relview.getTypeView();
            const fromObjview = relview.getFromObjectView();
            if (fromObjview) {
                let node: goNode | null = model?.findNodeByViewId(fromObjview.id);
                if (debug) console.log('635 fromNode', node);
                if (node) {
                    this.fromNode = node;
                    this.from = node.key;
                    const toObjview: akm.cxObjectView | null = relview.getToObjectView();
                    if (toObjview) {
                        node = model?.findNodeByViewId(toObjview.id);
                        if (debug) console.log('642 toNode', node);
                        if (node) {
                            this.toNode = node;
                            this.to = node.key;
                        }
                    }
                }
            }
            if (debug) console.log('650 relshipLink', this);
        }
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
        if (debug) console.log('722 typeview, relview: ', typeview, relview);
        if ((relview) && (typeview)) {
            if (!relview.markedAsDeleted) {
                if (this.toNode && this.fromNode) {
                    const viewdata: any = typeview.data;
                    const data: any = typeview.data;
                    this.addData(data);
                    this.setName(relview.name);
                    this.points = relview.points;
                    for (let prop in viewdata) {
                        // this[prop] = typeview[prop];
                        if (relview[prop] && relview[prop] !== "" && relview[prop] != undefined) {
                            this[prop] = relview[prop];
                        } else {
                            this[prop] = typeview[prop];
                        }
                    }        
                }
            }
            if (debug) console.log('744 typeview, relview: ', typeview, relview);
        } else if (relview) {
            const relship: akm.cxRelationship | null = relview.relship;
            if (relship && (relship.category === constants.gojs.C_RELATIONSHIP)) {
                if (relship.viewkind === constants.viewkinds.REL) {
                    const reltype = relship.type;
                    if (reltype) {
                        if (reltype.typeview) {
                            const data: any = reltype.typeview.data;
                            this.addData(data);
                            this.setName(relview.name);
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

export class goRelshipTypeLink extends goRelshipLink {
    reltype:    akm.cxRelationshipType | null;
    typeview:   akm.cxObjectTypeView | akm.cxRelationshipTypeView | null;
    fromNode:   goNode | null;
    toNode:     goNode | null;
    from:       string | undefined;
    to:         string | undefined;
    cardinality: string;
    cardinalityFrom: string;
    cardinalityTo: string;
    nameFrom:   string;
    nameTo:     string;
    points:     any;
    constructor(key: string, model: goModel, reltype: akm.cxRelationshipType | null) {
        super(key, model);
        this.category   = constants.gojs.C_RELSHIPTYPE;
        this.reltype    = reltype;
        this.typeview   = null;
        this.fromNode   = null;
        this.toNode     = null;
        this.from       = "";
        this.to         = "";
        this.cardinality = "";
        this.cardinalityFrom = "";
        this.cardinalityTo = "";
        this.nameFrom = "";
        this.nameTo = "";
        this.points = null;

        if (reltype) {
            this.setName(reltype.getName());
            this.setType(constants.gojs.C_RELSHIPTYPE);
            this.cardinalityFrom = this.reltype.cardinalityFrom;
            this.cardinalityTo = this.reltype.cardinalityTo;
            this.nameFrom = this.reltype.nameFrom;
            this.nameTo = this.reltype.nameTo;
            const typeview: akm.cxObjectTypeView | akm.cxRelationshipTypeView | null
                = reltype.getDefaultTypeView();
            if (typeview) {
                this.typeview = typeview;
                const data = typeview.getData();
                this.addData(data);
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
    getToNode() {
        return this.toNode;
    }
    loadLinkContent() {
        if (this.reltype) {
            if (this.reltype.markedAsDeleted === false) {
                if (this.toNode && this.fromNode) {
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
    template: string;
    geometry: string;
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
        this.template = "";
        this.geometry = "";
        this.fillcolor = "lightyellow";
        this.strokecolor = "black";
        this.strokewidth = "1";
        this.icon = "";
    }
}
