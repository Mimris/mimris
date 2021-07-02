// @ts-nocheck
import React, { useState, useEffect } from "react";
import * as utils from '../../akmm/utilities';

const debug = false

// function to find a object with name = matchingTitle
// NB! for now its hardcoded and if x-osdu-relationship does not exist it returns null
function searchTree(element, matchingTitle){
    // console.log('19', element, matchingTitle, element["x-osdu-relationship"]);
    if(element["x-osdu-relationship"]){
            return element;
    }else if (element.children != null){
            var i;
            var result = null;
            for(i=0; result == null && i < element.children.length; i++){
                result = searchTree(element.children[i], matchingTitle);
            }
            return result;
    }
    return null;
}

// read and convert OSDU Json format
export const ReadConvertJSONFromFile = async (props, dispatch, e) => {
    e.preventDefault()
    const reader = new FileReader()
    // reader.fileName = file.name
    reader.onload = async (e) => { 
        const text = (e.target.result)
        const osduMod = JSON.parse(text) // importert JSON file
        
        const osduSchemaSource = 'json-file-'+osduMod.title // adding text to top object to get uniqe name if import of different files
        // const osduSchemaSource = osduMod["x-osdu-schema-source"]
        const topName = (osduSchemaSource) ? osduSchemaSource : "json"
        console.log('34', osduMod, osduSchemaSource, { [topName]: osduMod });
        const osduModel = { [topName]: osduMod } // top object is given topName as key 
        if (debug) console.log('37 ', topName, osduModel);
        

        // define a modelview from shemaInfo and identiy
        // const osduSchemaModelview = {
        //     id: osduModel.schemaInfo.schemaIdentity.id,
        //     name: osduModel.schemaInfo.schemaIdentity.entityType,
        //     description: osduModel.schemaInfo.schemaIdentity.authority,
        // }

        const informationTypeId = '6bab35bb-f339-4ca0-f458-6c0cb7d0d302'
        const propertyTypeId = '6ca3e143-bb47-4533-4ed0-0e9e0f8bb0c4' 
        const hasPartTypeId = '0c2653b4-f201-48bb-d738-75d97de01d36'
        const hasMemberTypeId = "6d6aa1f9-4f2b-44f4-c009-65b52490bf22"
        
        function process(key,value) { //called with every property and its value
            if (key === "id") key = "$id"  // We will use our own uuid so rename if source has id
            // if (key === 'name' && (!value))  key = "contryName"
            const attribute = {[key]:value}
            return attribute
        }

        const initNewObj = (objectName, ancestryName, parentName, typeRef) => { // set up new object with some initial attributes
            const osduIdPath = (ancestryName) 
                ? (parentName) ? ancestryName+'::'+parentName+'::'+objectName : ancestryName+'::'+objectName 
                : objectName
            
            console.log('65 : ',  ancestryName, parentName, objectName);
            console.log('66 : ', 'osduIdPath', osduIdPath)//,  ancestryName, parentName, objectName);

            return  {
                // id: utils.createGuid(),
                
                id: (parentName === 'properties') ? objectName : osduIdPath, // in Osdu objectname is unique
                name: objectName,
                typeRef: typeRef,
                abstract: false,
                viewkind: "",
                markedAsDeleted: false,
                generatedTypeId: "",
                modified: false
            }
        };     

        const initNewRelship = (typeRef, objectName, fromObjRef, toObjRef) => { // set up new relship with some initial attributes
            return {
                cardinality: "",
                cardinalityFrom: undefined,
                cardinalityTo: undefined,
                description: "",
                fromobjectRef: fromObjRef,
                generatedTypeId: "",
                id: utils.createGuid(),
                markedAsDeleted: false,
                modified: true,
                name: objectName,
                relshipkind: "",
                relshipviews: undefined,
                title: "",
                toobjectRef: toObjRef,
                typeRef: typeRef,
            }
        
        }

        // Create AKMM object of the Json-object
        const createObj = (sourceObject, currentName, parentObj, ancestryName, nameAttr, listName, list, func) => { 
            const typeRef = (parentObj.name === "properties") ? propertyTypeId : informationTypeId     
            // init new Object   
            const newObj = initNewObj(currentName, ancestryName, parentName, typeRef) 
            // if parent object make a hasPart relationship
            // init new relationship
            const newRel = (parentObj.id && newObj.id) && initNewRelship(hasPartTypeId, " hasPart", parentObj.id, newObj.id) 
            // -------
                console.log('96 :', sourceObject, newObj, newRel, nameAttr, objList);             
                traverse(sourceObject, newObj, newRel, nameAttr, listName, list, func);  //going one step down in the object tree!!   
            // -------      
        }
        // traversing the JSON tree to extract all objects and dispatch
        //-----------------------------------------------------------------------------------------------------
        function traverse(o, parentObj, parRel, nameAttr, listName, list, func) { // o = current object
            let parentId = parentObj.id
            let parentName = parentObj.name
            let importedObject
            for (var i in o) { // i = child in current object
                let  attributes, newObj, newRel, newLinkRel           
                if (o[i] !== null && typeof(o[i]) === "object" ) { 
                    ancestryName = parentName
                    const sourceObj = o[i]
                    let sourceObjName = (sourceObj[`${nameAttr}`]) ? i+': '+sourceObj[`${nameAttr}`] : i                    
                    if (!list) { // if list is not given, create all
                        createObj(sourceObj, sourceObjName, parentObj, ancestryName, nameAttr, listName, list, func)    // sourceobject, sourceObj name, parentobject
                    } else if (listName !== parentName) { // if parent is listname create object
                        console.log('123 : ', listName, list, sourceObj, sourceObj[`${nameAttr}`]);
                        createObj(sourceObj, sourceObjName, parentObj, ancestryName, nameAttr, listName, list, func)    // sourceobject, sourceObj name, parentobject 
                    } else { // if list includes name create object
                            if (list.includes(sourceObj[`${nameAttr}`])) {   
                            createObj(sourceObj, sourceObjName, parentObj, ancestryName, nameAttr, listName, list, func)    // sourceobject, sourceObj name, parentobject 
                        }
                    }
                    // } else if (searchTree(o, 'x-osdu-relationship') !== null) { // new relationship making offpage object to link to other end
                    // console.log('158 : ', o[i], i, parentObj);
                    // // i er objectName
                    // createObj(o[i], i, parentObj, func)
                } else {
                
                    const attribute = func.apply(this, [i,o[i]])                     
                    // importedObjects += ' ,'+func.apply(this,[i,o[i]])+''                      
                    attributes = {
                       ...attributecoll,
                       ...attribute,
                    }   
                    const attributecoll = attributes
                }
                     
                importedObject = {
                    ...parentObj,
                    ...attributes,
                }   
            }
            
            if (debug) console.log('165 for : ', importedObject);   
            if (importedObject && importedObject.name !== undefined) 
                props.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: importedObject }
            );  
                // importedObject.name !== "0" &&  importedObject.name !=="1" &&
                // importedObject.name !== "2" && importedObject.name !== "3" &&  importedObject.name !=="4") &&
            if (parRel && parRel.id !== undefined) props.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: parRel });
            if (debug) console.log('169 ----- : ', parentId, parentName, o);   
        }

        const parentName = "";
        const parentId = "";
        let ancestryName = "json-top";
        
        // console.log('15', parentName, parentId);
        let attrnam, oList, listnam, list = "", listName, nameAttribute
        // const listName = prompt("Type in the name of the list (leave blank if nothing):", listnam);
        // const list = prompt("Type a list of objects (delimited with ,) (leave blank if nothing", oList);
        // const nameAttribute = prompt("Type in the attribute to be used as Name (leave blank if nothing):", attrnam);
        let listwithtop= (list !== "") && list + ",json, country" // top object must be included
        let objList= (listwithtop) ? listwithtop.split(",") : null;
        let objectPath = [parentName] //Path to keep order of where we are in the structure
        let objectIdPath = [parentId]
        console.log('169 :', nameAttribute, list, objList);
        
        //that's all... no magic, no bloated framework
        // traverse(currentObj, parentId, parentName, nameAttribute, name-of-key-of-the-object-containing-the-lst, userinputlist-of-objects, process);
        traverse(osduModel, parentId, parentName, nameAttribute, listName, objList, process);
        
    };
    reader.readAsText(e.target.files[0])
  }