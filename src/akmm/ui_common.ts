// @ts-nocheck
/*
    Functions used by the GoJS modellers
*/
const glb 				= require('./akm_globals');
const utils 			= require('./utilities');
const constants			= require('./constants');

import * as go from 'gojs';
import * as akm from './metamodeller';
// import * as gjs  from './ui_gojs';


let $ = go.GraphObject.make;
let myModel:        any;
let myAkmModel:     any;
let myModelView:    any;
let myAkmModelView: any;
let myMetamodel:    any;
let myGoMetaModel:  any;
let myGoModel:      any;
let myDiagram:      any;
let myDiagram1:     any;
let SD:             any;

    // Function makePort
    export function makePort(name: string, spot: any, output: any, input: any) {
      // the port is basically just a small transparent square
      return $(go.Shape, "Circle",
               {
                  fill: null,  // not seen, by default; set to a translucent gray by showSmallPorts, defined below
                  stroke: null,
                  desiredSize: new go.Size(7, 7),
                  alignment: spot,  // align the port on the main Shape
                  alignmentFocus: spot,  // just inside the Shape
                  portId: name,  // declare this object to be a "port"
                  fromSpot: spot, toSpot: spot,  // declare where links may connect at this port
                  fromLinkable: output, toLinkable: input,  // declare whether the user may draw links to/from here
                  cursor: "pointer"  // show a different cursor to indicate potential link point
               });
    }

    // Function showSmallPorts
    export function showSmallPorts(node: any, show: boolean) {
      node.ports.each(function(port: any) {
        if (port.portId !== "") {  // don't change the default port, which is the big shape
          port.fill = show ? "rgba(0,0,0,.3)" : null;
        }
      });
    }

    // Function to identify images related to an image id
    export function findImage(image: string) {
        if (!utils.isArrayEmpty(image)) {
            return "./../images/" + image;
        }
        return "";
    }

    // Function to specify default text style
    export function textStyle() {
      return { font: "9pt  Segoe UI,sans-serif", stroke: "black" };
    }

    // Function to highlight group
    export function highlightGroup(e: any, grp: any, show: boolean) {
        if (!grp) return;
        e.handled = true;
        if (show) {
          // cannot depend on the grp.diagram.selection in the case of external drag-and-drops;
          // instead depend on the DraggingTool.draggedParts or .copiedParts
          var tool = grp.diagram.toolManager.draggingTool;
          var map = tool.draggedParts || tool.copiedParts;  // this is a Map
          // now we can check to see if the Group will accept membership of the dragged Parts
          if (grp.canAddMembers(map.toKeySet())) {
            grp.isHighlighted = true;
            return;
          }
        }
        grp.isHighlighted = false;
    }

    // UML export function to convert visibility
    export function convertVisibility(v: string) {
        switch (v) {
            case "public": return "+";
            case "private": return "-";
            case "protected": return "#";
            case "package": return "~";
            default: return v;
        }
    }

    // Callback export function initiated at partResized
    export function partResized(e: any, part: any, diagram: any) {

        if (part instanceof go.Group) {
            let grp = part;
            if (grp && grp.layout) {
                grp.layout.invalidateLayout();
                let data = part.data;
                if (utils.objExists(data)) {
                    if (data.category === constants.C_OBJECT) {
                        let objview = data.objectview;
                        let size    = data.size;
                        if (!(size === "")) {
                            if (utils.objExists(objview)) {
                                objview.setModified();
                                objview.setSize(size);
                                diagram.model.setDataProperty(data, "size", size);
                                console.log(objview);
                            }
                        }
                    }      
                }
            }
        }
        else if (part instanceof go.Node) {
            let data = part.data;
            if (data) {
                if (data.category === constants.C_OBJECTTYPE) {
                    let objtype = data.objecttype;
                    if (objtype) {
                        objtype.setModified();
                        let size = data.size;
                        objtype.setSize(size);
                        diagram.model.setDataProperty(data, "size", size);
                        console.log(objtype);
                    }
                }
                if (data.category === constants.C_OBJECT) {
                    let objview = data.objectview;
                    let size    = data.size;
                    if (!(size === "")) {
                        if (objview) {
                            objview.setModified();
                            objview.setSize(size);
                            diagram.model.setDataProperty(data, "size", size);
                            console.log(objview);
                        }
                    }
                }      
            }
        }
    }

    // Callback export function initiated at mouseDrop
    export function finishDrop(e: any, grp: any, diagram: any) {
        var ok = (grp !== null
          ? grp.addMembers(grp.diagram.selection, true)
          : e.diagram.commandHandler.addTopLevelParts(e.diagram.selection, true));
        if (!ok) 
            e.diagram.currentTool.doCancel();
    }

    export function addTopLevelParts(e: any) {
        e.diagram.commandHandler.addTopLevelParts(e.diagram.selection, true);
    }

    // Callback export function initiated on model change
    export function onModelChanged(e: any, evt: any, diagram: any) {
        if (e.modelChange === "nodeDataArray") {
            // record node insertions and removals
            if (e.change === go.ChangedEvent.Insert) {
                console.log(evt.propertyName + " added node with key: " + e.newValue.key);
                let n = e.newValue;
                n.parentModel = myGoModel;
                if (utils.objExists(n)) {
                    createNode(n, diagram);
                }
            } else if (e.change === go.ChangedEvent.Remove) {
                console.log(evt.propertyName + " removed node with key: " + e.oldValue.key);
                if (evt.propertyName === "CommittedTransaction") {
                    let n = e.oldValue;
                    deleteNode(n, true, diagram);
                } else if (evt.propertyName === "FinishedUndo") {
                    let n = e.oldValue;
                    deleteNode(n, false, diagram);
                }
            }
        } 
        else if (e.modelChange === "linkDataArray") {
            // record node insertions and removals
            if (e.change === go.ChangedEvent.Insert) {
                console.log(evt.propertyName + " added link with key: " + e.newValue.key);
                let data = e.newValue;
                if (utils.objExists(data)) {
                    createLink(data, diagram);
                }
            } else if (e.change === go.ChangedEvent.Remove) {
                console.log(evt.propertyName + " removed link with key: " + e.oldValue.key);
                if (evt.propertyName === "CommittedTransaction") {
                    let data = e.oldValue;
                    deleteLink(data, true, diagram);
                } else if (evt.propertyName === "FinishedUndo") {
                    let data = e.oldValue;
                    deleteLink(data, false, diagram);
                }
            }
        }
        else if (e.modelChange === "nodeGroupKey") {
            let node = e.object;
            if (node) {                
                console.log("Dropped " + node.key + " in group " + node.group);
                let groupNode = myGoModel.findNode(node.group);
                console.log(groupNode);
                if (groupNode)
                    connectNodeToGroup(node, groupNode);
                else {
                    groupNode = null;
                    disconnectNodeFromGroup(node, groupNode);
                }
            }
        }
        else if (e.modelChange === "nodeParentKey") {
            let node = e.object;
            console.log(node);
        }
        else if (e.modelChange === "linkFromKey") {
            let link = e.object;                    // goRelshipLink
            if (link.class === 'goRelshipLink') {        
                let relview = link.getRelshipView();    // cxRelationshipView
                let rel = relview.getRelationship();    // cxRelationship                
                switch(e.propertyName) {
                case "from":
                    if (evt.propertyName === "FinishedUndo")
                        link.from = e.oldValue;
                    else
                        link.from = e.newValue;
                    let fromNode = myGoModel.findNode(link.from);
                    if (utils.objExists(fromNode)) {
                        let fromObjView = fromNode.objectview;
                        relview.setFromObjectView(fromObjView);
                        rel.setFromObject(fromObjView.getObject());
                    }
                    break;
                case "to":
                    if (evt.propertyName === "FinishedUndo")
                        link.to = e.oldValue;
                    else
                        link.to = e.newValue;
                    let toNode   = myGoModel.findNode(link.to);
                    if (utils.objExists(toNode)) {
                        let toObjView = toNode.objectview;
                        relview.setToObjectView(toObjView);
                        rel.setToObject(toObjView.getObject());
                    }
                    break;
                }
                relview.setModified();
                rel.setModified();
            } else if (link.class === 'goRelshipTypeLink') { 
                let reltypeview = link.typeview;            // cxRelationshipTypeView
                let reltype     = reltypeview.getType();    // cxRelationshipType                
                switch(e.propertyName) {
                    case "from": {
                        if ((evt.propertyName === "FinishedUndo") || 
                            (evt.propertyName === "CommittedTransaction"))
                                link.from = e.newValue;
                        else 
                            link.from = e.oldValue;
                        if (utils.objExists(link.from)) {
                            let fromNode = myGoMetaModel.findNode(link.from);
                            reltype.setFromObjectType(fromNode.objecttype);   
                        }                     
                        reltype.setModified();
                    }
                }                        
            } else {
                // ??
            }
        }
        else if (e.modelChange === "linkToKey") {
            let link = e.object;                        // goRelshipLink
            if (link.class === 'goRelshipLink') {        
                let relview = link.getRelshipView();    // cxRelationshipView
                let rel = relview.getRelationship();    // cxRelationship                
                switch(e.propertyName) {
                case "from":
                    if (evt.propertyName === "FinishedUndo")
                        link.from = e.oldValue;
                    else
                        link.from = e.newValue;
                    if (utils.objExists(link.from)) {
                        let fromNode = myGoModel.findNode(link.from);
                        let fromObjView = fromNode.objectview;
                        relview.setFromObjectView(fromObjView);
                        rel.setFromObject(fromObjView.getObject());
                        relview.setModified();
                        rel.setModified();
                    }
                    break;
                case "to":
                    if (evt.propertyName === "FinishedUndo")
                        link.to = e.oldValue;
                    else
                        link.to = e.newValue;
                    if (utils.objExists(link.to)) {
                        let toNode   = myGoModel.findNode(link.to);
                        let toObjView = toNode.objectview;
                        relview.setToObjectView(toObjView);
                        rel.setToObject(toObjView.getObject());
                        relview.setModified();
                        rel.setModified();
                    }
                    break;
                }
            } else if (link.class === 'goRelshipTypeLink') { 
                if (link.from && link.to) {
                    let reltypeview = link.getTypeView();    // cxRelationshipTypeView
                    let reltype     = reltypeview.getType();    // cxRelationshipType                
                    switch(e.propertyName) {
                        case "to": 
                            if ((evt.propertyName === "FinishedUndo") || 
                                (evt.propertyName === "CommittedTransaction"))
                                    link.to = e.newValue;
                            else
                                link.to = e.oldValue;
                            let toNode = myGoMetaModel.findNode(link.to);
                            reltype.setToObjectType(toNode.objecttype);                        
                            reltype.setModified();
                        break;
                    }
                } else {
                    // ??
                }
            }
        }
        else if (e.propertyName === "position") {
            let data = e.object.data;
            if (data) {
                if (data.category === constants.C_OBJECTTYPE) {
                    let objtype = data.objecttype;
                    if (objtype) {
                        let loc = data.loc;
                        if (loc.length != 0) {
                            objtype.setLoc(loc);
                            objtype.setModified();
                        } else {
                            console.log(objtype);
                        }
                    }
                }
                else if (data.category === constants.C_OBJECT) {
                    let objview = data.objectview;
                    if (objview) {
                        let loc = data.loc;
                        if (loc.length != 0) {
                            objview.setLoc(loc);
                            objview.setModified();
                        } else {
                            console.log(objview);
                        }
                    }
                }
            }
        }
    }

    // Function to connect group object to node object
    export function connectNodeToGroup(node: any, groupNode: any) {
        if (node && groupNode) {
            let nodeObj  = node.object;
            let groupObj = groupNode.object;
            let nodeObjview  = node.objectview;
            let groupObjview = groupNode.objectview;            
            nodeObjview.setGroup(groupObjview.getId());
            // Find relationship type
            let groupType = groupObj.getType();
            let childType  = nodeObj.getType();
            if (groupType) {
                let reltype = groupType.findRelshipTypeByKind(constants.relkinds.COMP, childType);
                if (reltype) {
                    // Check if relship already exists
                    let rel = myModel.findRelationship1(groupObj, nodeObj, reltype);
                    if (!rel) {
                        rel = new akm.cxRelationship(utils.createGuid(), reltype, groupObj, nodeObj, reltype.getName(), reltype.getDescription());
                        if (rel) {
                            rel.setModified();
                            myModel.addRelationship(rel);
                            glb.metis.addRelationship(rel);
                        }
                    }
                } else {
                    let reltype = groupType.findRelshipTypeByKind(constants.relkinds.AGGR, childType);
                    if (reltype) {
                        let rel = new akm.cxRelationship(utils.createGuid(), reltype, groupObj, nodeObj, reltype.getName(), reltype.getDescription());
                        if (rel) {
                            rel.setModified();
                            myModel.addRelationship(rel);
                            glb.metis.addRelationship(rel);
                        }
                    }
                }
            }
        }
    }

    export function disconnectNodeFromGroup(node: any, groupNode: any) {
        if (!groupNode) {
            let nodeObj  = node.object;
            if (nodeObj) {
                let nodeObjview = node.objectview;
                nodeObjview.setGroup("");
                let rels = nodeObj.findInputRelships(myModel, constants.relkinds.COMP);
                for (let i = 0; i < rels.length; i++) {
                    let rel = rels[i];
                    if (rel) {
                        let fromObj = rel.getFromObject();
                        if (fromObj.getType().getViewKind() === constants.viewkinds.CONT) {
                            rel.setModified();
                            rel.setDeleted(true);
                        }
                    }
                }
            }
        }
    }

    // Callback export function initiated when a single node is selected
    export function onSelectionChanged(e: any, diagram: any) {
      var myNode = e.diagram.selection.first();
      if (myNode instanceof go.Node) {
        //updateProperty(myNode.data);
      } else {
        //updateProperty(null);
      }
    }

    // Verify if the given relationship type is allowed between the given objects
    export function isLinkAllowed(reltype: akm.cxRelationshipType, fromObj: akm.cxObject, toObj: akm.cxObject) {
        if (reltype && fromObj && toObj) {
            let fromType = reltype.getFromObjType();
            let toType   = reltype.getToObjType();
            if (fromType && toType) {
                let fromObjType = fromObj.getObjectType();
                if (fromObjType && fromObjType.inherits(fromType)) {
                    const toObjType = toObj.getObjectType();
                    if (toObjType && toObjType.inherits(toType)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Callback export function initiated when a link has been drawn
    export function onLinkDrawn(e: any, diagram: any) {
        let link = e.subject;
        let data = link.data;
        if (data.category === constants.C_RELATIONSHIP) {
            link.data.key = utils.createGuid();
            let fromNode = myGoModel.findNode(link.data.from);
            let fromType = fromNode.object.getType();
            let toNode   = myGoModel.findNode(link.data.to);
            let toType = toNode.object.getType();
            let typename = "";
            let itemtype = SD.itemType;
            if (
                (itemtype.length > 0 && (itemtype !== 'pointer') && itemtype !== 'link') 
            ) {
                typename = SD.itemType;
            } 
            /*
            else {
                diagram.commandHandler.showContextMenu(link);
                diagram.model.setDataProperty(link.data, "type", prompt("Enter type name:", "type"));
                if (data.type == null) {
                    diagram.model.removeLinkData(data); 
                    return;
                }
                typename = link.data.type;                
            } 
            */
            else {
                let types = myMetamodel.findRelationshipTypesBetweenTypes(fromType, toType);
                addElementsToSelectList("selectType", types);
                openSelectList("myModal", "selectType", link.data, diagram);
                return;
            }
            let reltype = myMetamodel.findRelationshipTypeByName(typename);
            if (!utils.objExists(reltype)) {
                alert("Relationship type given does not exist!")
                diagram.model.removeLinkData(data); 
                return;
            }
            if (!isLinkAllowed(reltype, fromNode.object, toNode.object)) {
                alert("Relationship given is not allowed!")
                diagram.model.removeLinkData(data); 
                return;
            }
            diagram.model.setDataProperty(link.data, "name", typename);
            createLink(link.data, diagram);
            diagram.requestUpdate();
        } else if (data.category === constants.C_RELSHIPTYPE) {
            data.key = utils.createGuid();
            diagram.model.setDataProperty(data, "name", prompt("Enter type name:", "typename"));
            if (data.name == null) {
                diagram.model.removeLinkData(data); 
                return;
            }
            diagram.model.setDataProperty(data, "category", constants.C_RELSHIPTYPE);
            let typename = data.name;
            if (typename) {
                let fromNode = e.subject.fromNode.data;
                let toNode   = e.subject.toNode.data;
                let fromObjType = myMetamodel.findObjectTypeByName(fromNode.name);
                let toObjType   = myMetamodel.findObjectTypeByName(toNode.name);
                if (fromObjType && toObjType) {
                    let reltype   = glb.metis.findRelationshipTypeByName(typename);
                    if (reltype) {                    
                        // Existing type - create a copy
                        let relkind = reltype.getRelshipKind();
                        let reltype2 = new akm.cxRelationshipType(utils.createGuid(), reltype.getName(), fromObjType, toObjType, "");
                        reltype2.setModified();
                        reltype2.setRelshipKind(relkind);
                        diagram.model.setDataProperty(data, "reltype", reltype2);
                        diagram.model.setDataProperty(data, "category", constants.C_RELSHIPTYPE);
                        myMetamodel.addRelationshipType(reltype2);
                        glb.metis.addRelationshipType(reltype2);
                        let reltypeView = reltype.getDefaultTypeView();
                        if (reltypeView) {
                            // Copy reltypeview
                            let reltypeView2 = new akm.cxRelationshipTypeView(utils.createGuid(), reltype2.getName(), reltype2, "");
                            reltypeView2.setModified();
                            reltypeView2.setRelshipKind(relkind);
                            diagram.model.setDataProperty(data, "typeview", reltypeView2);
                            let viewdata: any = reltypeView.getData();
                            let viewdata2: any = reltypeView2.getData();
                            let prop: any;
                            for (prop in viewdata) {
                                viewdata2[prop] = viewdata[prop];                            
                            }
                            reltype2.setDefaultTypeView(reltypeView2);
                            myMetamodel.addRelationshipTypeView(reltypeView2);
                            glb.metis.addRelationshipTypeView(reltypeView2);
                            updateLink(data, reltypeView2, diagram);
                            diagram.requestUpdate();
                        }
                    } else {
                        // New relationship type - create it
                        let typeid = utils.createGuid();
                        reltype = new akm.cxRelationshipType(typeid, data.name, null, null, "");
                        if (reltype) {
                            diagram.model.setDataProperty(data, "reltype", reltype);
                            diagram.model.setDataProperty(data, "category", constants.C_RELSHIPTYPE);
                            reltype.setModified();
                            reltype.setFromObjtype(fromObjType);
                            reltype.setToObjtype(toObjType);
                            myMetamodel.addRelationshipType(reltype);
                            glb.metis.addRelationshipType(reltype);
                            // Then create the default relationship typeview
                            let reltypeView = new akm.cxRelationshipTypeView(utils.createGuid(),reltype.getName(), reltype, "");   
                            if (reltypeView) {
                                reltypeView.setModified();
                                diagram.model.setDataProperty(data, "typeview", reltypeView);
                                reltype.setDefaultTypeView(reltypeView);
                                myMetamodel.addRelationshipTypeView(reltypeView);
                                glb.metis.addRelationshipTypeView(reltypeView);
                                updateLink(data, reltypeView, diagram);
                                diagram.requestUpdate();
                            }
                        }
                    }
                }
            }
        }
    }

    // Callback export function initiated when a property has changed in the Data Inspector
    export function onPropertyChanged(data: any, name: string, value: string, diagram: any) {
        if (data.category === constants.C_OBJECTTYPE) {
            diagram.model.setDataProperty(data, name, value);
            updateObjecttypeProperty(data, name, value, diagram);
        } else if (data.category === constants.C_RELSHIPTYPE) {
            diagram.model.setDataProperty(data, name, value);
            updateRelationshiptypeProperty(data, name, value, diagram);
        } else {
            updateProperty(data, name, value, diagram);
        }
    }

    // Callback export function initiated when the user double clicked the background
    export function backgroundCreated(e: any, isMetamodelling: boolean, diagram: any) {
        if (!isMetamodelling)    
            return;
        let tb = e.subject;
        console.log(tb);
        if (tb === null) return;
        let myNode = tb.part;
    }

    // Callback export function initiated when the user has finished inline text-editing
    export function onTextEdited(e: any, diagram: any) {        
        var tb = e.subject;
        if (tb === null) return;
        let myNode = tb.part;
        let field = tb.name;
        if (field.length == 0) {    // Hack
            field = "name";
        }
        if (myNode instanceof go.Node) {
            updateData(myNode, field, tb.text, diagram);
        }
        if (myNode instanceof go.Link) {
            updateData(myNode, field, tb.text, diagram);
        }
    }

    // Function to call when a link has been drawn
    export function buildLinkFromReltype(reltype: akm.cxRelationshipType, data: any, diagram: any) {
        let reltypeView = reltype.getDefaultTypeView();
        if (reltypeView) {
            updateLink(data, reltypeView, diagram);
            diagram.requestUpdate();
        }
        return data;
    }    

    // Function to call when a link has been drawn
    export function buildLinkFromRelview(relview: akm.cxRelationshipView, relship: akm.cxRelationship, data: any, diagram: any) {
        let reltype     = relship.getType();
        let reltypeView = relview.getTypeView() as any;
        if (reltype) {
            if (!reltypeView) {
                reltypeView = reltype.getDefaultTypeView();
            }
            if (reltypeView) {
                updateLink(data, reltypeView, diagram);
                diagram.requestUpdate();
            }
        }
        return data;
    }    

    // Function called when a new link has been created 
    export function createLink(data: any, diagram: any) {
        if (!data.key) 
            data.key = utils.createGuid();
        if (data.category) {
            if (data.category === constants.C_RELSHIPTYPE) {
                // Identify  type   
                data.class  = "goRelshipTypeLink";
            }
            else if (data.category === constants.C_RELATIONSHIP) {
                // Identify  type   
                let reltype = null;
                data.class  = "goRelshipLink";
                reltype     = myMetamodel.findRelationshipTypeByName(data.name);
                if (reltype && reltype.isInstantiable()) {
                    // Create the relationship
                    let fromNode    = myGoModel.findNode(data.from);
                    let fromObjView = fromNode.objectview;
                    let toNode      = myGoModel.findNode(data.to);
                    let toObjView   = toNode.objectview;
                    let fromObj     = null;
                    if (fromObjView) {
                        fromObj = fromObjView.getObject();
                    }
                    let toObj = null;
                    if (toObjView) {
                        toObj = toObjView.getObject();
                    }
                    if (fromObj && toObj) {
                        // Find relationship if it already exists
                        let relship = myModel.findRelationship1(fromObj, toObj, reltype);
                        if (!relship) {
                            relship = new akm.cxRelationship(utils.createGuid(), reltype, fromObj, toObj, reltype.getName(), "");
                            if (relship) {
                                relship.setModified();
                                data.relship = relship;
                                relship.setName(reltype.getName());
                                myModel.addRelationship(relship);
                                glb.metis.addRelationship(relship);
                            }
                        }
                        if (relship) {
                            let typeview = reltype.getDefaultTypeView();
                            let relshipview = new akm.cxRelationshipView(utils.createGuid(), relship.getName(), relship, "");
                            if (relshipview) {
                                relshipview.setModified();
                                data.relshipview = relshipview;
                                relshipview.setName(relship.getName());
                                relshipview.setTypeView(typeview);                            
                                relshipview.setFromObjectView(fromObjView);
                                relshipview.setToObjectView(toObjView);
                                myModelView.addRelationshipView(relshipview);
                                glb.metis.addRelationshipView(relshipview);
                                let linkData = buildLinkFromRelview(relshipview, relship, data, diagram);
                                console.log(linkData);
                            }
                        }
                    }
                } else {
                    /* Unknown type
                    if (utils.objExists(diagram) && objExists(data))
                        diagram.remove(data);
                    */
                } 
            }
        }
    }

    // Function called when a new node has been created 
    export function createNode(data: any, diagram: any) {
        //diagram.model.startTransaction("node created " + data.name);
        if (data.category === constants.C_PALETTEGROUP_OBJ) {
            data.category = constants.C_OBJECT;
            diagram.model.setDataProperty(data, "category", constants.C_OBJECT);
        }
        if (data.category === constants.C_OBJECTTYPE) {
            data.class = "goObjectTypeNode";
            let typeid   = data.type;
            let typename = data.name;
            if (typeid === constants.types.OBJECTTYPE_ID)  {
                if ((typename !== constants.OBJECTTYPE_NAME) || (typename !== constants.CONTAINERTYPE_NAME)) {
                    // Metamodeling and existing type
                    let objtype = myMetamodel.findObjectTypeByName(typename);
                    if (objtype) {
                        let objtypeView = objtype.getDefaultTypeView();
                        if (!objtypeView) {
                            objtypeView = new akm.cxObjectTypeView(utils.createGuid(), objtype.getName(), objtype, objtype.getDescription());
                            objtypeView.setModified();
                            objtype.setDefaultTypeView(objtypeView);
                            objtype.setModified();
                            myMetamodel.addObjectTypeView(objtypeView);
                            glb.metis.addObjectTypeView(objtypeView);
                        }
                        // Configure the node
                        diagram.model.setDataProperty(data, "category", constants.C_OBJECTTYPE);
                        diagram.model.setDataProperty(data, "objecttype", objtype);
                        updateNode(data, objtypeView, diagram);                       
                    }
                    else {
                        // Create type
                        typename = "New Type";
                        if (data.viewkind === constants.VIEWKINDS.CONT)
                            typename = "New Container";
                        let objtype = new akm.cxObjectType(utils.createGuid(), typename, "");
                        if (objtype) {
                            objtype.setModified();
                            objtype.setViewKind(data.viewkind);
                            myMetamodel.addObjectType(objtype);
                            glb.metis.addObjectType(objtype);
                            // Define the object typeview
                            let objtypeView = new akm.cxObjectTypeView(utils.createGuid(), objtype.getName(), objtype, "");
                            if (objtypeView) {
                                objtypeView.setModified();
                                objtypeView.setViewKind(data.viewkind);
                                let viewdata = objtypeView.getData();
                                let prop: any;
                                let vdata: any = viewdata;
                                for (prop in viewdata) {
                                    if (prop === "icon")
                                        continue;
                                    vdata[prop] = data[prop];                            
                                }
                                objtype.setDefaultTypeView(objtypeView);
                                myMetamodel.addObjectTypeView(objtypeView);
                                glb.metis.addObjectTypeView(objtypeView);
                                // Update the node accordingly
                                diagram.model.setDataProperty(data, "category", constants.C_OBJECTTYPE);
                                diagram.model.setDataProperty(data, "objecttype", objtype);
                                diagram.model.setDataProperty(data, "name", typename);
                                updateNode(data, objtypeView, diagram);                                                            
                            }
                        }
                    }
                }
                return data;
            }
        } 
        else if (data.category === constants.C_OBJECT) {
            // Identify object type   
            let objtype = null;
            data.class = "goObjectNode";
            objtype = data.objecttype;
            if (objtype) {
                // Create the object
                let obj   = new akm.cxObject(utils.createGuid(), data.name, objtype, "");
                if (obj) {
                    data.object = obj;
                    // Include the new object in the current model
                    myModel.addObject(obj);
                    glb.metis.addObject(obj);
                    // Create the corresponding object view
                    let objview   = new akm.cxObjectView(utils.createGuid(), obj.getName(), obj, "");                   
                    if (objview) {
                        data.objectview = objview;
                        objview.setIsGroup(objtype.isContainer());
                        // Include the object view in the current model view
                        myModelView.addObjectView(objview);
                        glb.metis.addObjectView(objview);
                        // Then update the node with its new properties
                        // First set category and name
                        diagram.model.setDataProperty(data, "category", constants.C_OBJECT);
                        diagram.model.setDataProperty(data, "type", data.name);
                        // Then set reference to the object view                        
                        diagram.model.setDataProperty(data, "objectview", objview);
                        // Then set the view properties
                        // Get the object typeview
                        let objtypeView = objtype.getDefaultTypeView();
                        objtypeView.setIsGroup(data.viewkind);
                        objview.setTypeView(objtypeView);
                        updateNode(data, objtypeView, diagram);                        
                    }
                }
            }
            return data;
        }
    }

    export function updateLink(data: any, reltypeView: any, diagram: any) {
        if (utils.objExists(reltypeView)) {
            let viewdata = reltypeView.getData();
            let prop: any;
            for(prop in viewdata){
                if (viewdata[prop] != null)
                    diagram.model.setDataProperty(data, prop, viewdata[prop])
            }
            console.log(data);
        }
    }

    export function updateNode(data: any, objtypeView: any, diagram: any) {
        if (utils.objExists(objtypeView)) {
            let viewdata = objtypeView.getData();
            let prop:any;
            for(prop in viewdata){
                if (viewdata[prop] != null)
                diagram.model.setDataProperty(data, prop, viewdata[prop])
            }
            console.log(data);
        }
    }

    // Function to call when a node has been deleted
    export function deleteNode(data: any, deletedFlag: boolean, diagram: any) {
        // To be done
        let model = diagram.model;
        if (data.category === constants.C_OBJECTTYPE) {
            //let typeid = data.objecttype;
            let typename = data.name;
            let objtype = myMetamodel.findObjectTypeByName(typename);
            if (objtype) {
                objtype.deleted = deletedFlag;
                let objtypeview = objtype.getDefaultTypeView();
                if (objtypeview) {
                    objtypeview.deleted = deletedFlag;
                }
            }
        } else if (data.category === constants.C_OBJECT) {
            // Modelling
            let objview = data.objectview;
            if (objview) {
                objview.deleted = deletedFlag;
                let obj = objview.getObject();
                if (obj) {
                    obj.deleted = deletedFlag;
                }
            }
        }
    }

    // Function to call when a link has been deleted
    export function deleteLink(data: any, deletedFlag: boolean, diagram: any) {
        let model = diagram.model;
       if (data.category === constants.C_RELSHIPTYPE) {
            // To be done
            let typename = data.name;
            let reltype = data.reltype;
            if (reltype) {
                reltype.deleted = deletedFlag;
                let reltypeview = data.typeview;
                if (reltypeview) {
                    reltypeview.deleted = deletedFlag;
                }
            }
        } else if (data.category === constants.C_RELATIONSHIP) {
            // Modelling
            let relview = data.relshipview;
            if (relview) {
                relview.deleted = deletedFlag;
               let rel = data.relship;
                if (rel) {
                    rel.deleted = deletedFlag;
                }
            }
        }
    }

    // Update the data fields when the text is changed
    export function updateData(myNode: any, field: string, text: string, diagram: any) {
        var myNode = diagram.selection.first();
        // maxSelectionCount = 1, so there can only be one Part in this collection
        if (myNode instanceof go.Node && myNode.data !== null) {
            var model = diagram.model;
            var data  = myNode.data;
            model.startTransaction("modified " + field);
            if (field === "name") {
                model.setDataProperty(data, "name", text);
                if (data.class === 'goObjectTypeNode') {  
                    if (data.category === constants.C_OBJECTTYPE) {
                        // This is a modification of an existing type
                        updateObjectType(data, field, text, diagram);
                    }
                } else if (data.class === 'goObjectNode') {
                    if (data.category === constants.C_OBJECT) {
                        // This is a modification of an object
                        updateObject(data, field, text, diagram);
                    }
                }
            } else if (field === "title") {
              model.setDataProperty(data, "title", text);
            } else if (field === "comments") {
                model.setDataProperty(data, "comments", text);
            } else {
                if (data.class === 'goObjectTypeNode') {
                    if (data.category === constants.C_OBJECTTYPE) {
                        updateObjecttypeProperty(data, field, text, diagram);
                    } else {
                        updateProperty(data, field, text, diagram);
                    }
                } else if (data.class === 'goObjectNode'){
                    updateProperty(data, field, text, diagram);
                }
            }
            model.commitTransaction("modified " + field);
        }
        if (myNode instanceof go.Link && myNode.data !== null) {
            var model = diagram.model;
            var data  = myNode.data;
            model.startTransaction("modified " + field);
            if (field === "name") {
                model.setDataProperty(data, "name", text);
            } else if (field === "title") {
                model.setDataProperty(data, "title", text);
            } else if (field === "comments") {
                model.setDataProperty(data, "comments", text);
            }
            if (data.class === 'goRelshipTypeLink') {
                if (data.category === constants.C_RELSHIPTYPE) {
                    updateRelationshiptypeProperty(data, field, text, diagram);
                } else {
                    updateProperty(data, field, text, diagram);
                }
            } else if (data.class === 'goRelshipLink'){
                updateProperty(data, field, text, diagram);
            }
            model.commitTransaction("modified " + field);
        }
    }  

    export function updateObjectType(data: any, name: string, value: string, diagram: any) {
        if ((data === null) || (name !== "name")) {
            return;
        }    
        else 
        {
            // Check if this is a type change
            let objtype = data.objecttype;            
            let typename = data.name;
            if (objtype) {
                if  (
                    (objtype.getName() === "New Type") 
                    ||
                    (objtype.getName() === "New Container") 
                    ) {
                    // This is a new type that gets a new name 
                    // Check if the new name already exists
                    let otype = glb.metis.findObjectTypeByName(typename);
                    if (otype) {
                        // Existing type - the new name already exists
                        let typeid = objtype.getId();
                        objtype = otype;
                        utils.removeElementFromArray(myMetamodel.getObjectTypes(), typeid);
                        myMetamodel.addObjectType(objtype);
                        utils.removeElementFromArray(glb.metis.getObjectTypes(), typeid);
                        glb.metis.addObjectType(objtype);
                    } else {
                        objtype.setName(typename);
                        objtype.setModified();
                    }
                } else {
                    // This is an existing type that gets a new name
                    objtype.setName(typename);
                    objtype.setModified();
                }
                // Get object typeview
                let objtypeView = objtype.getDefaultTypeView();
                if (!objtypeView) {
                    objtypeView = new akm.cxObjectTypeView(utils.createGuid(), typename, objtype, "");
                    objtypeView.setModified();
                    objtype.setDefaultTypeView(objtypeView);
                    objtype.setModified();
                    myMetamodel.addObjectTypeView(objtypeView);
                    glb.metis.addObjectTypeView(objtypeView);
                } else {
                    objtype.setName(typename);
                    objtype.setModified();
                    objtypeView.setName(typename);
                    objtypeView.setModified();
                }                
            }
        }
    }

    export function updateObject(data: any, name: string, value: string, diagram: any) {
        if ((data === null) || (name !== "name") || (!utils.objExists(data.object))) {
            return;
        } else {
            let currentObject     = data.object;
            let currentObjectView = data.objectview;
            let otype             = data.objecttype;
            if (currentObject.getName() === otype.getName()) {
                // This is a new object - check if the new name already exists
                let obj = glb.metis.findObjectByTypeAndName(otype, data.name);
                if (obj) {
                    // Existing object
                    utils.removeElementFromArray(myModel.getObjects(), currentObject.getId());
                    currentObject = obj;
                    currentObjectView.setObject(currentObject);
                    myModelView.addObjectView(currentObjectView);
                } 
            }
            currentObject.setName(value);
            currentObject.setModified();
            currentObjectView.setName(value);
            currentObjectView.setModified();
        }
    }

    // Function updateProperty
    export function updateProperty(data: any, name: string, value: string, diagram: any) {
        if (data === null) {
            return;
        } else if (data.category === constants.C_OBJECT) {
            // data.key is the id of the node
            // data.objectview is the id of the objectview           
            let currentObjectView = data.objectview;
            let currentObject = data.object;
            if (currentObjectView) {
                if (currentObject) {                   
                    let objtype  = currentObject.getType();
                    let typeView = currentObjectView.getTypeView();
                    if (!typeView /* || (typeView.getId() === defaultTypeview.getId())*/) {
                        typeView = new akm.cxObjectTypeView(utils.createGuid(), currentObjectView.getName(), objtype, "");
                        typeView.setModified();
                        currentObjectView.setTypeView(typeView);
                        myMetamodel.addObjectTypeView(typeView);
                        glb.metis.addObjectTypeView(typeView);
                    }
                    let viewdata = typeView.getData();
                    /*
                    for (prop in viewdata) {
                        viewdata[prop] = (utils.objExists(data[prop])) ? data[prop] : null;                           
                    }    
                    */                
                    switch (name) {
                        case "name":
                            if (currentObject.getName() === objtype.getName()) {
                                // This is a new object - check if the new name already exists
                                let obj = glb.metis.findObjectByTypeAndName(objtype, data.name);
                                if (obj) {
                                    // Existing object
                                    utils.removeElementFromArray(myModel.getObjects(), currentObject.getId());
                                    currentObject = obj;
                                    currentObjectView.setObject(currentObject);
                                    myModelView.addObjectView(currentObjectView);
                                } 
                            }                    
                            currentObject.setName(value);
                            currentObjectView.setName(value);
                            diagram.model.setDataProperty(data, "name", value);
                            break;
                        case "description":
                            currentObject.setDescription(value);
                            break;
                        case "groupLayout":
                            setDiagramLayout(data.groupLayout, data);
                            break;
                        default:
                            currentObject.setStringValue2(name, value);
                            let prop: any;                           
                                for(prop in viewdata){
                                    if (prop === name) {
                                        viewdata[prop] = value;
                                        diagram.model.setDataProperty(data, name, value);
                                        break;
                                    }
                                } 
                            /*
                            } else {
                                let p = objtype.findPropertyByName(name);
                                if (utils.objExists(p)) {
                                    currentObject.setStringValue2(name, value);
                                    currentObjectView.setStringValue2(name, value);
                                    viewdata[name] = value;
                                    diagram.model.setDataProperty(data, name, value);
                                }
                                break;
                            }
                            */                
                            break;
                        }
                }
                let objtypeView = currentObjectView.getTypeView();
                updateNode(data, objtypeView, diagram);
            }           
        } 
        else if (data.category === constants.C_RELATIONSHIP) {
            // data.key is the id of the link
            // data.relshipview is the id of the relationshipview           
            let currentRelship = data.relship;
            let currentRelshipView = data.relshipview;
            let reltype = currentRelship.getType();
            if (utils.objExists(currentRelshipView) && utils.objExists(currentRelship)) {
                let typeView = currentRelshipView.getTypeView();
                let defaultTypeview = reltype.getDefaultTypeView();
                if (!utils.objExists(typeView) || 
                    (typeView.getId() === defaultTypeview.getId())) {
                    typeView = new akm.cxRelationshipTypeView(utils.createGuid(), currentRelshipView.getName(), currentRelship, "");
                    currentRelshipView.setTypeView(typeView);
                    myMetamodel.addRelationshipTypeView(typeView);
                    glb.metis.addRelationshipTypeView(typeView);
                }
                let viewdata = typeView.getData();
                let prop: any;
                for (prop in viewdata) {
                    viewdata[prop] = data[prop];                            
                }
                switch (name) {
                    case "name":
                        currentRelship.setName(value);
                        currentRelshipView.setName(value);
                        diagram.model.setDataProperty(data, "name", value);
                        data.relshipview = currentRelshipView;
                        break;
                    case "description":
                        diagram.model.setDataProperty(data, "description", value);
                        currentRelship.setDescription(value);
                        break;
                    default:
                        currentRelship.setStringValue(name, value);                            
                        diagram.model.setDataProperty(data, name, value);
                        for(prop in viewdata) {
                            if (prop === name) {
                                viewdata[prop] = value;
                                diagram.model.setDataProperty(data, prop, value);
                                break;
                            }
                        }                            
                        break;
                }
            }           
        }
    }

    // Function updateObjecttypeProperty
    export function updateObjecttypeProperty(data: any, name: string, value: string, diagram: any) {
        if (data === null) {
            return;
        } else {
            let objtype = data.objecttype;   
            if (objtype) {
                let typename = objtype.getName();
                switch (name) {
                    case "description":
                        objtype.setDescription(value);
                        diagram.model.setDataProperty(data, name, value);
                        break;
                    case "abstract":
                        objtype.setAbstract(value);
                        diagram.model.setDataProperty(data, name, value);
                        break;
                        case "viewkind":
                            objtype.setViewKind(value);
                            diagram.model.setDataProperty(data, name, value);
                            break;
                        case "relshipkind":
                            objtype.setRelshipKind(value);
                            diagram.model.setDataProperty(data, name, value);
                            break;
                }
            // Get object typeview
                let objtypeView = objtype.getDefaultTypeView();
                if (!objtypeView) {
                    objtypeView = new akm.cxObjectTypeView(utils.createGuid(), typename, objtype, "");
                    objtypeView.setModified();
                    objtype.setDefaultTypeView(objtypeView);
                    myMetamodel.addObjectTypeView(objtypeView);
                    glb.metis.addObjectTypeView(objtypeView);
                }
                if (objtypeView) {
                    let viewdata = objtypeView.getData();
                    let prop: any;
                    for(prop in viewdata) {
                        viewdata[prop] = data[prop];
                        if (prop === "abstract") {
                            viewdata[prop] = data[prop];
                        }
                        if (prop === "loc") {
                            objtype.setLoc(value);
                        }
                        if (prop === "viewkind") {
                            viewdata[prop] = data[prop];
                        }
                    }                                                
                    updateNode(data, objtypeView, diagram); 
                }
            }
        }
    }

    // Function updateRelationshiptypeProperty
    export function updateRelationshiptypeProperty(data: any, name: string, value: string, diagram: any) {
        if (data === null) {
            return;
        } else {
            let reltype  = data.reltype;
            switch (name) {
                case "name":
                    reltype.setName(value);
                    diagram.model.setDataProperty(data, name, value);
                    break;
                case "description":
                    reltype.setDescription(value);
                    diagram.model.setDataProperty(data, name, value);
                    break;
                case "abstract":
                    reltype.setAbstract(value);
                    diagram.model.setDataProperty(data, name, value);
                    break;
                case "relshipkind":
                    reltype.setRelshipKind(value);
                    diagram.model.setDataProperty(data, name, value);
                    break;
            }
            // Get relationship typeview
            let reltypeView = reltype.getDefaultTypeView();;
            if (!reltypeView) {
                reltypeView = new akm.cxRelationshipTypeView(utils.createGuid(), name, reltype, "");
                reltype.setDefaultTypeView(reltypeView);
                myMetamodel.addRelationshipTypeView(reltypeView);
                glb.metis.addRelationshipTypeView(reltypeView);
            }
        if (reltypeView) {
            let viewdata = reltypeView.getData();
            let prop: any;
            for(prop in viewdata){
                if (prop === name) {
                    viewdata[prop] = value;
                    if (prop === "abstract") {
                        reltypeView.setAbstract(value);
                    }
                    if (prop === "relshipkind") {
                        reltypeView.setRelshipKind(value);
                    }
                    break;
                }
            }                            
        updateLink(data, reltypeView, diagram); 
                diagram.requestUpdate();
            }
        }
    }

    // Tooltip functions
    export function nodeInfo(d: any) {  // Tooltip info for a node data object
      var str = "Node: " + d.name + "\n";
      if (d.group)
        str += "member of " + d.group;
      else
        str += "Type: " + d.type;
      return str;
    }

    export function linkInfo(d: any) {  // Tooltip info for a link data object
        let reltype = myMetamodel.findRelationshipTypeByName(d.name);
        
        let fromObjtype = reltype.getFromObjType();
        let toObjtype   = reltype.getToObjType();
        
        let str = "Link: " + d.name + "\n";
        str += "from: " + fromObjtype.name + "\n"; 
        str += "to: "   + toObjtype.name; 
        return str;             
    }

    export function diagramInfo(model: any) {  // Tooltip info for the diagram's model
        var str = "Model:\n";
        str += model.nodeDataArray.length + " nodes, ";
        str += model.linkDataArray.length + " links";
        return str;
    }
        
    export function UniqueKeyFunc() {
        return utils.createGuid();
    }

    export function UniqueLinkKeyFunc() {
        return utils.createGuid();
    }

    export function setDiagramLayout(kind: string, container: any) {
        var $ = go.GraphObject.make; 
        switch (kind) {
            case "Circular": 
                container.layout = $(go.CircularLayout); 
                container.layout.isOngoing = false;
                break;
            case "ForceDirected": 
                container.layout = 
                    $(go.ForceDirectedLayout, 
                    { 	
                        defaultSpringLength: 30, 
                        defaultElectricalCharge: 100 
                    }); 
                    break;
            case "LayeredDigraph": 
                container.layout = 
                    $(go.LayeredDigraphLayout, 
                    { 
                        direction: 90 
                    }); 
                break;
            case "Grid": 
                container.layout = $(go.GridLayout,
                    {
                        sorting: go.GridLayout.Ascending
                    });
                break;
            case "Tree": 
                container.layout = $(go.TreeLayout,
                    {
                        angle: 90
                    });
                break;
            default: 
                container.layout = $(go.CircularLayout); 
                container.layout.isInitial = false;
                container.layout.isOngoing = false;
                break;
        }
    }

    export function toggleLayout(diagram: any) { 
        var $ = go.GraphObject.make; 
        if (diagram.layout instanceof go.ForceDirectedLayout) {
             diagram.layout = 
                $(go.LayeredDigraphLayout, 
                { 
                    direction: 90 
                }); 
        } 
        else { 
            diagram.layout = 
                $(go.ForceDirectedLayout, 
                { 	
                    defaultSpringLength: 30, 
                    defaultElectricalCharge: 100 
                }); 
            } 
    }    

    export function loadJson(nodeDataArray: any[], linkDataArray: any[], diagram: any) {
        // create the model parsed from JSON text
        diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
        diagram.model.copiesKey = false;
        diagram.model.makeUniqueKeyFunction = UniqueKeyFunc;
        diagram.model.makeUniqueLinkKeyFunction = UniqueLinkKeyFunc;
    }
        
    export function clearModel(diagram: any) {
        let nodes = "[]";
        let nodeArray = JSON.parse(nodes);
        let links = "[]";
        let linkArray = JSON.parse(links);
        loadJson(nodeArray, linkArray, diagram);
    }
    function addElementsToSelectList(listId: string, listElement: any) {
    }
        
    function openSelectList(modalId: string, listId: string, data: any, diagram: any) {

    }
