// @ts-nocheck
// Application code
const debug = false;

const constants = require('./constants');
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
    args1: any[];
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
        this.args1 = this.model?.args1;
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
        // node.setParentModel(this);
        node.setParentModelRef(this);
        let oldNodes: goObjectNode[] = new Array();
        for (let i = 0; i < this.nodes?.length; i++) {
            let n = this.nodes[i] as goObjectNode;
            if (n.key !== node.key)
                oldNodes.push(n);
        }
        oldNodes.push(node as goObjectNode);
        this.nodes = oldNodes;
    }
    addLink(link: goLink) {
        let oldLinks: goLink[] = new Array();
        for (let i = 0; i < this.links.length; i++) {
            let lnk = this.links[i] as goLink;
            oldLinks.push(lnk);
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
                if (node.objecttype.id === objtypeId) {
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
                const ll = link as goRelshipLink;
                if (ll.relshipview && ll.relshipview.id === relviewId) {
                    return (ll);
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
            const ll = links[i];
            if (ll.key === link.key) {
                links[i] = link;
                break;
            }
        }
    }
    updateTypeLink(link: goRelshipTypeLink) {
        const links = this.links;
        for (let i = 0; i < links.length; i++) {
            const ll = links[i];
            if (ll.key === link.key) {
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
                    let lng = objecttypes.length;
                    for (i = 0; i < lng; i++) {
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
                        lng = relshiptypes ? relshiptypes.length : 0;
                        for (i = 0; i < lng; i++) {
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
    // parentModel: goModel | null;
    parentModelRef: string;
    data: any;
    constructor(key: string) {
        // this.parentModel = null;
        this.parentModelRef = "";
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
    // getParentModel() {
    //     return this.parentModel;
    // }
    getParentModelRef() {
        return this.parentModelRef;
    }
    // setParentModel(model: goModel) {
    //     this.parentModel = model;
    // }
    setParentModelRef(model: goModel) {
        this.parentModelRef = model?.key;
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
    // parentModel: goModel | null;
    parentModelRef:  string;
    text:            string;
    loc:             string;
    size:            string;
    scale:           string;
    scale1:          string;
    memberscale:     string;
    strokecolor:     string;
    strokecolor2:    string;
    fillcolor:       string;
    fillcolor2:      string;
    viewkind:        string;
    markedAsDeleted: boolean;
    constructor(key: string, model: goModel | null) {
        super(key);
        // this.parentModel = model;  // goModel
        this.parentModelRef = model?.key;  // goModel
        this.text = "";
        this.loc = "";
        this.size = "";
        this.scale = "";
        this.scale1 = "";
        this.memberscale = "";
        this.strokecolor = "";
        this.strokecolor2 = "";
        this.fillcolor = "";
        this.fillcolor2 = "";
        this.viewkind = "";
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
    setScale(scale: string) {
        this.scale = scale;
        this.scale1 = scale;
    }
    getScale(): string {
        return this.scale;
    }
    getScale1(): string {
        return this.scale1;
    }
    setViewkind(kind: string) {
        this.viewkind = kind;
    }
    getViewkind(): string {
        return this.viewkind;
    }
}

export class goObjectNode extends goNode {
    objectview: akm.cxObjectView | null;
    //objectview_0: akm.cxObjectView | null;
    object: akm.cxObject | null;
    objecttype: akm.cxObjectType | null;
    typename: string;
    typedescription: string;
    typeview: akm.cxObjectTypeView | null;
    leftPorts: akm.cxPort[] | null;
    rightPorts: akm.cxPort[] | null;
    topPorts: akm.cxPort[] | null;
    bottomPorts: akm.cxPort[] | null;
    template: string;
    figure: string;
    geometry: string;
    strokewidth: string;
    textcolor: string;
    textscale: string;
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
        this.leftPorts      = null;
        this.rightPorts     = null;
        this.topPorts       = null;
        this.bottomPorts    = null;
        this.typename       = "";
        this.typedescription = "";
        this.template       = objview.template;
        this.figure         = objview.figure;
        this.geometry       = objview.geometry;
        this.fillcolor      = objview.fillcolor;
        this.fillcolor2      = objview.fillcolor2;
        this.strokecolor    = objview.strokecolor;
        this.strokecolor2   = objview.strokecolor2;
        this.strokewidth    = objview.strokewidth;
        this.textcolor      = objview.textcolor;
        this.textscale      = objview.textscale;
        this.icon           = objview.icon;
        this.isGroup        = objview.isGroup;
        this.scale1         = objview.scale1;
        this.memberscale    = objview.memberscale;
        this.isCollapsed    = objview.isCollapsed;
        this.groupLayout    = "Tree";
        this.group          = objview.group;
        this.parent         = "";

        if (objview) {
            const object = objview.getObject();
            if (object) {
                this.object = object;
                this.name = object.getName();
                const objtype = object.getType() as akm.cxObjectType;
                if (objtype) {
                    this.objecttype = objtype;
                    this.typename = objtype.getName();
                    this.typedescription = this.objecttype.getDescription();
                    // Check if a Draft property exists
                    const draft = objtype.findPropertyByName("Draft");
                    if (draft) {
                        const value = object.getStringValue2("Draft");
                        if (value.length > 0) {
                            this.typename = value;
                        }
                    }
                } else {
                    this.objecttype = null;
                    this.typename = "";
                    this.typedescription = "";
                    //this.type = "";
                }
                this.leftPorts = object.getLeftPorts();
                this.rightPorts = object.getRightPorts();
                this.topPorts = object.getTopPorts();
                this.bottomPorts = object.getBottomPorts();
            }
            this.typeview = objview.getTypeView();
            if (!this.template)
                this.template = this.typeview?.template;
                if (!this.geometry)
                this.geometry = this.typeview?.geometry;
            if (!this.figure)
                this.figure = this.typeview?.figure;
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
                    if (prop === 'scale1') {
                        if (objview.scale1 === "") {
                            this[prop] = "1";
                        }
                        this[prop] = Number(this[prop]);
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
                this.setScale(this.objectview.getScale())
                // this.isCollapsed = this.objectview.isCollapsed;
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
    getParentNode(model: goModel): goNode {
        const groupId = this.group;
        if (groupId !== "") {
            const nodes = model.nodes;
            for (let i = 0; i < nodes?.length; i++) {
                const node = nodes[i] as goObjectNode;
                if (node.key === groupId) {
                    return node;
                }
            }
        }
        return null;
    }
    getTopNode(model: goModel): goNode {
        const node = this.getParentNode(model);
        if (node) {
            if (node.key === this.key) {
                return this;
            } else {
                const topNode = node.getTopNode(model);
                if (topNode) {
                    return topNode;
                } else
                    return this;
            }
        }
        return this;
    }
    getMyScale(model: goModel): number {
        // let scale = this.typeview.memberscale;
        let scale = this.scale1;
        const pnode = this.getParentNode(model);
        if (pnode) {
            scale = pnode.typeview.memberscale;
            scale *= pnode.getMyScale(model);
        } else 
            scale = 1;
        return scale;
    }
    getActualScale(model: goModel): number {
        let scale1 = this.scale1;
        const node = this.getParentNode(model);
        if (debug) console.log('597 node', node);
        if (node && node.key !== this.key) {
            let scale = node.getActualScale(model);
            scale1 *= scale;
            if (debug) console.log('601 scale, scale1', scale, scale1);
        }
        return scale1;
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
    addPort(side: string, name: string) {
        const port = new cxPort(utils.createGuid(), name, "", side);
        if (side === constants.gojs.C_LEFT) {
            this.leftPorts.push(port);
        } else if (side === constants.gojs.C_RIGHT) {
            this.rightPorts.push(port);
        } else if (side === constants.gojs.C_TOP) {
            this.topPorts.push(port);
        } else if (side === constants.gojs.C_BOTTOM) {
            this.bottomPorts.push(port);
        }
    }
    removePort(side: string, name: string) {
        if (side === constants.gojs.C_LEFT) {
            this.leftPorts = this.leftPorts.filter(p => p.name !== name);
        } else if (side === constants.gojs.C_RIGHT) {
            this.rightPorts = this.rightPorts.filter(p => p.name !== name);
        } else if (side === constants.gojs.C_TOP) {
            this.topPorts = this.topPorts.filter(p => p.name !== name);
        } else if (side === constants.gojs.C_BOTTOM) {
            this.bottomPorts = this.bottomPorts.filter(p => p.name !== name);
        }
    }
}

export class goObjectTypeNode extends goNode {
    objecttype: akm.cxObjectType | null;
    typeview: akm.cxObjectTypeView | akm.cxRelationshipTypeView | null;
    typename: string;
    typedescription: string;
    constructor(key: string, objtype: akm.cxObjectType) {
        super(key, null);
        this.category = constants.gojs.C_OBJECTTYPE;
        this.objecttype = objtype;
        this.typeview = null;
        this.typename = constants.gojs.C_OBJECTTYPE;
        this.typedescription = "";
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
                this.setViewkind(objtype.getViewKind());
                if (metamodel) {
                    let loc = objtype.getLoc(metamodel)
                    this.setLoc(loc);
                    let size = objtype.getSize(metamodel);
                    this.setSize(size);
                }
            }
            if (debug) console.log('671 loadNodeContent', this);
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
    // parentModel: goModel;
    parentModelRef: string;
    markedAsDeleted: boolean;
    constructor(key: string, model: goModel) {
        super(key);
        this.parentModelRef = model.key;  // goModel
        // this.parentModel = model;  // goModel
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
    fromPort:           string;
    toPort:             string;
    arrowscale:         string;
    strokecolor:        string;
    strokewidth:        string;
    textcolor:          string;
    textscale:          string;
    fromArrow:          string;
    toArrow:            string;
    fromArrowColor:     string;
    toArrowColor:       string;
    routing:            string;
    curve:              string;
    corner:             string;
    points:             any;
    relshipkind:        string;
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
        this.fromPort        = relview?.fromPortid;
        this.toPort          = relview?.toPortid;
        this.template        = relview?.template;
        this.arrowscale      = relview?.arrowscale;
        this.strokecolor     = relview?.strokecolor;
        this.strokewidth     = relview?.strokewidth;
        this.textcolor       = relview?.textcolor;
        this.textscale       = relview?.textscale;
        this.fromArrow       = relview?.fromArrow;
        this.fromArrowColor  = relview?.fromArrowColor;
        this.toArrow         = relview?.toArrow;
        this.toArrowColor    = relview?.toArrowColor;
        this.routing         = relview?.routing ? relview.routing : "";
        this.curve           = relview?.curve ? relview.curve : "";
        this.corner          = relview?.corner ? relview.corner : "";
        this.points          = null;
        this.relshipkind     = "";
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
            this.relshipkind = this.relshiptype?.getRelshipKind();
            if (!this.template)
                this.template = this.typeview?.template;
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
    setFromPort(pid: string) {
        this.fromPort = pid;
    }
    getFromPort(): string {
        return this.fromPort;
    }
    setToPort(pid: string) {
        this.toPort = pid;
    }
    getToPort(): string {
        return this.toPort;
    }
    setToNode(to: string) {
        this.to = to;
    }
    getRelshipKind(): string {
        const typeview: akm.cxRelationshipTypeView | null = this.typeview;
        if (typeview) {
            return typeview.getRelshipKind();
        } else
            return this.relshipkind;
    }
    setRelshipKind(kind: string) {
        this.relshipkind = kind;
    }
    loadLinkContent(model: goModel) {
        const relview: akm.cxRelationshipView | null = this.relshipview;
        const typeview: akm.cxRelationshipTypeView | null = this.typeview;
        const modelview = model.modelView;
        if (debug) console.log('722 typeview, relview: ', typeview, relview);
        if ((relview) && (typeview)) {
            if (!relview.markedAsDeleted) {
                if (this.toNode && this.fromNode) {
                    const viewdata: any = typeview.data;
                    const data: any = typeview.data;
                    // this.addData(data);
                    this.setName(relview.name);
                    this.points = relview.points;
                    for (let prop in viewdata) {
                        if (prop === 'abstract') continue;
                        if (prop === 'class') continue;
                        if (prop === 'category') continue;
                        // this[prop] = typeview[prop];
                        if (relview[prop] && relview[prop] !== "" && relview[prop] != undefined) {
                            this[prop] = relview[prop];
                        } else {
                            this[prop] = viewdata[prop];
                            // this[prop] = typeview[prop];
                        }
                    }        
                }
            }
            if (debug) console.log('744 goRelshipLink, typeview, relview: ', this, typeview, relview);
        } 
        // else if (relview) {
        //     const relship: akm.cxRelationship | null = relview.relship;
        //     if (relship && (relship.category === constants.gojs.C_RELATIONSHIP)) {
        //         if (relship.viewkind === constants.viewkinds.REL) {
        //             const reltype = relship.type;
        //             if (reltype) {
        //                 if (reltype.typeview) {
        //                     const data: any = reltype.typeview.data;
        //                     this.addData(data);
        //                     this.setName(relview.name);
        //                 }
        //             }
        //         }
        //     }
        // }
        this.routing = modelview.routing;
        this.curve = modelview.linkcurve;
        if (modelview.showCardinality) {
            this.cardinalityFrom = relview.relship?.getCardinalityFrom(); 
            this.cardinalityTo = relview.relship?.getCardinalityTo();
        } else {
            this.cardinalityFrom = "";
            this.cardinalityTo = "";
        }
        if (!this.fromArrow && !this.toArrow)
            this.toArrow = 'OpenTriangle';
        if (this.toArrow && this.toArrow === 'None')
            this.toArrow = '';
        if (debug) console.log('764 goRelshipLink, this: ', this);
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
    typeview:   akm.cxRelationshipTypeView | null;
    fromNode:   goNode | null;
    toNode:     goNode | null;
    from:       string | undefined;
    to:         string | undefined;
    template:   string;
    relshipkind: string;
    cardinality: string;
    cardinalityFrom: string;
    cardinalityTo: string;
    nameFrom:   string;
    nameTo:     string;
    strokecolor: string;
    strokewidth: string;
    textcolor:      string;
    arrowscale:     string;
    textscale:      string;
    dash:           string;
    routing:    string;
    curve:      string;
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
        this.template   = "";
        this.relshipkind = "";
        this.cardinality = "";
        this.cardinalityFrom = "";
        this.cardinalityTo = "";
        this.nameFrom = "";
        this.nameTo = "";
        this.points = null;

        if (reltype) {
            this.setName(reltype.getName());
            this.setType(constants.gojs.C_RELSHIPTYPE);
            this.relshipkind = this.reltype.relshipkind;
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
                    this.fromNode = model.findTypeNode(fromObjtype.id);
                    this.from = this.fromNode?.key;
                    const toObjtype: akm.cxObjectType | null = reltype.getToObjType();
                    if (toObjtype) {
                        this.toNode = model.findTypeNode(toObjtype.id);
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
                        if (!this.strokwidth)
                            this.strokewidth = '1';
                        if (!this.strokecolor)
                            this.strokecolor = 'black';
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
    figure: string;
    geometry: string;
    fillcolor: string;
    fillcolor2: string;
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
        this.figure = "";
        this.geometry = "";
        this.fillcolor = "lightyellow";
        this.fillcolor2 = "";
        this.strokecolor = "black";
        this.strokewidth = "1";
        this.icon = "";
    }
}
