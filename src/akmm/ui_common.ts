// @ts-nocheck

import * as utils from './utilities';
import * as akm from './metamodeller';
// import { gojs } from './constants';
import * as gjs from './ui_gojs';
const constants = require('./constants');
// import * as constants from './constants';


export function updateObject(data: any, name: string, value: string, context: any) {
    if ((data === null) || (name !== "name") || (!data.object)) {
        return;
    } else {
        // const myMetis     = context.metis;
        // const myMetamodel = context.metamodel;
        // const myModel     = context.model;
        // const myModelView = context.modelview;
        // const myDiagram   = context.diagram; 

        let currentObject = data.object as akm.cxObject;
        let currentObjectView = data.objectview as akm.cxObjectView;
        let otype = data.objecttype as akm.cxObjectType;
        if (otype.getName() === constants.AKM_DATATYPE) {
            // Special handling of datatypes
            value = value.toLowerCase();
            let dtype = context.myMetis.findDatatypeByName(value);
            if (!dtype) {
                // Create new datatype
                dtype = new akm.cxDatatype(utils.createGuid(), value, constants.AKM_DATATYPE + ": " + value);
                context.myMetis.addDatatype(dtype);
            }
        }
        currentObject.setName(value);
        currentObject.setModified();
        currentObjectView.setName(value);
        currentObjectView.setModified();
        const diagram = context.myDiagram;
        diagram.model.setDataProperty(data, "name", value);
    }
}
export function createObject(data: any, context: any) {
    if (data === null) {
        return;
    } else {
        data.key = utils.createGuid();
        data.category = constants.C_OBJECT;
        data.class = "goObjectNode";
        const myMetis = context.myMetis;
        const myModel = context.myModel;
        const myModelview = context.myModelview;
        const myGoModel = context.myGoModel;
        const myDiagram = context.myDiagram;
        console.log('53 createObject', data);
        const otypeId = data.objecttype.id;
        const objtype = myMetis.findObjectType(otypeId);
        console.log('48 createObject', objtype);
        let guid = utils.createGuid();
        let obj = new akm.cxObject(guid, data.name, objtype, data.description);
        if (obj) {
            data.object = obj;
            // Include the new object in the current model
            myModel?.addObject(obj);
            myMetis.addObject(obj);
            console.log('59 createObject', obj, myModel);
            // Create the corresponding object view
            let objview = new akm.cxObjectView(utils.createGuid(), obj.getName(), obj, "");
            if (objview) {
                data.objectview = objview;
                objview.setIsGroup(objtype.isContainer());
                objview.setSize(data.size);
                // Include the object view in the current model view
                myModelview.addObjectView(objview);
                myMetis.addObjectView(objview);
                // Then update the node with its new properties
                // First set category and name
                myDiagram.model.setDataProperty(data, "category", constants.C_OBJECT);
                myDiagram.model.setDataProperty(data, "type", data.name);
                // Then set reference to the object view                        
                myDiagram.model.setDataProperty(data, "objectview", objview);
                // Then set the view properties
                // Get the object typeview
                let objtypeView = objtype.getDefaultTypeView();
                if (!objtypeView) {
                    objtypeView = new akm.cxObjectTypeView(utils.createGuid(), objtype.getName(), objtype, "");
                }
                if (objtypeView) {
                    objtypeView.setIsGroup(data.viewkind);
                    objview.setTypeView(objtypeView);
                    let node = new gjs.goObjectNode(data.key, objview);
                    myGoModel.addNode(node);
                    updateNode(data, objtypeView, myDiagram);
                }
            }
        }
    }
}

function updateNode(data: any, objtypeView: akm.cxObjectTypeView, diagram: any) {
    if (objtypeView) {
        let viewdata: any = objtypeView.getData();
        let prop: string;
        for (prop in viewdata) {
            if (viewdata[prop] != null)
                diagram.model.setDataProperty(data, prop, viewdata[prop])
        }
        console.log('updateNode', data);
    }
}
