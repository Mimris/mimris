// @ts-nocheck
import React, { useState, useEffect } from "react";
import * as utils from '../../akmm/utilities';

const debug = false

// read and convert OSDU Json format
export const ReadConvertJSONFromFile = async (props, dispatch, e) => {
    e.preventDefault()
    const reader = new FileReader()
    reader.onload = async (e) => { 
        const text = (e.target.result)
        // const osduModel = JSON.parse(text)
        const osduModel = {'json': JSON.parse(text)}
        // if (!debug) console.log('11 ',  osduModel);
        
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
        // define a modelview from shemaInfo and identiy
        // const osduSchemaModelview = {
        //     id: osduModel.schemaInfo.schemaIdentity.id,
        //     name: osduModel.schemaInfo.schemaIdentity.entityType,
        //     description: osduModel.schemaInfo.schemaIdentity.authority,
        // }

        const informationTypeId = '6bab35bb-f339-4ca0-f458-6c0cb7d0d302'
        const propertyTypeId = '6ca3e143-bb47-4533-4ed0-0e9e0f8bb0c4' 
        const hasPartTypeId = '0c2653b4-f201-48bb-d738-75d97de01d36'

        
        function process(key,value) { //called with every property and its value
            // const tkey = String(key).replace(/\$id/g, 'id')
            // const tval = String(value).replace(/"/g, '')
            // const attribute = JSON.parse(`{"${key}" : "${value}"}`);
            const attribute = {[key]:value}
            // const attribute = {}
            // Object.defineProperties(attribute, {[`${key}`]: {value: `${value}`,}});

            // Object.defineProperties(attribute, {`${key}`: {value: `${value}`,}});
            // console.log('52', attribute);
            return attribute
        }

        const initNewObj = (typeName,typeRef) => { // set up new object with some initial attributes
            return  {
                id: utils.createGuid(),
                name: typeName,
                typeRef: typeRef,
                abstract: false,
                viewkind: "",
                markedAsDeleted: false,
                generatedTypeId: "",
                modified: false
            }
        };     

        const initNewRelship = (typeRef, typeName, fromObjRef, toObjRef) => { // set up new relship with some initial attributes
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
                name: typeName,
                relshipkind: "",
                relshipviews: undefined,
                title: "",
                toobjectRef: toObjRef,
                typeRef: typeRef,
            }
        
        }


        // traversing the JSON tree to extract all objects and dispatch
        //-----------------------------------------------------------------------------------------------------
        function traverse(o, parentObj, parRel, func) {
            let  parentId = parentObj.id
            let parentName = parentObj.name
            console.log('97 ----- : ', parentId, parentName, o, objectPath, objectIdPath);        
            // console.log('94', Object.keys(o)[0], objectPath);
            // const parName = Object.keys(o)[0]
            let importedObject
            for (var i in o) {
                let  attributes, newObj, newRel       
                console.log('105 :', typeof(o[i]), i, o[i]);                    
                if (o[i] !== null && typeof(o[i]) === "object") {
  
                    console.log('107 if object: ', typeof(o[i]), i, o[i]);   

                    const typeRef = (parentName === "properties") ? propertyTypeId : informationTypeId     
                    // init new Object   
                    newObj = initNewObj(i,typeRef) 
                    // if parent object make a hasPart relationship
                    console.log('112 parentId newObj.id : ', parentId, parentName, newObj, newObj.id);
                    // init new relationship
                    newRel = (parentId && newObj.id) && initNewRelship(hasPartTypeId, parentObj.name+" hasPart", parentId, newObj.id) 
                    
                    console.log('115 ----- : ', objectPath,  objectIdPath, parentId, parentName);    
                    objectPath.push(i) // add current object to path
                    objectIdPath.push(newObj.id)
                    console.log('117 ----- : ', newObj.name, objectPath,  objectIdPath, parentId, parentName);   
                    console.log('118 :', o[i], newObj.id, i);
                    // -------
                        traverse(o[i], newObj, newRel, func);  //going one step down in the object tree!!   
                    // -------      
                    
                    objectPath.pop()
                    objectIdPath.pop()
                    parentId =  objectIdPath[objectIdPath.length - 1]
                    parentName=  objectPath[objectPath.length - 1]
                    console.log('126 ----- : ', newObj.name, objectPath,  objectIdPath, parentId, parentName);    
                                    
                } else {
                    if (i === "id")  continue; // drop for now
                    // if (i === "$ref")  continue; // drop for now
                    // if (i === "x-osdu-relationship")  continue; // drop for now
                    // if (parentName === "required")  continue; // drop for now
                    // if (parentName === "additionalProperties")  continue; // drop for now
                    // if (parentName === "x-osdu-inheriting-fromkind")  continue; // drop for now

                    // chencking if a relationship is defined. We dont have the other end. We can make a temporary object?
                    // if (searchTree(o, 'x-osdu-relationship') !== null) {
                    //     console.log('130 relship tobe created :', o["x-osdu-relationship"]);
                    //     // if (relatedObj) props.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: relatedObj });
                    //     // if (relationship) props.dispatch({ type: 'UPDATE_RELATIONSHIP_PROPERTIES', data: relationship });
                    //     continue;
                    // };
                    
                    // console.log('150',
                    //     func.apply(this,[i,o[i]])                     
                    // );
                    const attribute = func.apply(this,[i,o[i]])                     
                    // importedObjects += ' ,'+func.apply(this,[i,o[i]])+''                      
                    console.log('141 : ', parentObj, attribute)
                    attributes = {
                       ...attributecoll,
                       ...attribute,
                    }   
                    const attributecoll = attributes
                    console.log('142 : ', attributes, attributecoll);
                }

                
                console.log('148 etter if : ', parentObj, attributes);         
                importedObject = {
                    ...parentObj,
                    ...attributes,
                }   
            }
            
            console.log('165 for : ', importedObject);   
            if (importedObject && importedObject.name !== undefined) 
                props.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: importedObject }
            );  
                // importedObject.name !== "0" &&  importedObject.name !=="1" &&
                // importedObject.name !== "2" && importedObject.name !== "3" &&  importedObject.name !=="4") &&
            if (parRel && parRel.id !== undefined) props.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: parRel });
            console.log('169 ----- : ', parentId, parentName, o);   
        }

        const parentName = "top"
        const parentId = "11111";
        
        // console.log('15', parentName, parentId);

        let objectPath = [parentName] //Path to keep order of where we are in the structure
        let objectIdPath = [parentId]

        //that's all... no magic, no bloated framework
        // traverse(osduModel, process);
        traverse(osduModel, parentId, parentName, process);
      
        
        



















        // Osdu object types = schemaInfo, schemaIdentiy, schema > properties, data > allOf > properties
        //                     

     


        // // get schemaIdentity props -------------------------------------------
        // const osduSchemaIdentity = osduModel.schemaInfo.schemaIdentity
        // const osduSchemaIdentityProps1 = Object.entries(osduSchemaIdentity)
        // const osduSchemaIdentityProps = fillObject(osduSchemaIdentityProps1, "schemaIdentity", propertyTypeId, 'Property', false);
        // // const osduIdentityProps  = osduSchemaProps2.map(p => JSON.parse(`[ "${p[0]}", { "value": "${p[1]}" } ]`))
        // if (!debug) console.log('28 ConvertJSONToModels', osduSchemaIdentityProps1, osduSchemaIdentityProps);
        
        // const schemaIdentityObject = fillObject(osduSchemaIdentityProps, informationsTypeId, 'Information', false);
        // if (schemaIdentityObject) props.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: schemaIdentityObject }); 

        // // schemaInfo props -----------------------------------------------
        // const osduSchemaInfo = osduModel.schemaInfo
        // const osduSchemaInfoProps1 = Object.entries(osduSchemaInfo) // get children
        // const osduSchemaInfoProps = osduSchemaInfoProps1.map(p => (p[0] !== 'schemaIdentity') && p ).filter(Boolean) 
        // if (!debug) console.log('27 ConvertJSONToModels', osduSchemaInfoProps1, osduSchemaInfoProps);        

        // // schema props  .-------------------------------------------------
        // const osduSchema = osduModel.schema
        // const osduSchemaProps1 = Object.entries(osduSchema) 
        // const osduSchemaProps = osduSchemaProps1.map(p => (
        //     p[0] !== 'properties' && 
        //     p[0] !== 'required' && 
        //     p[0] !== 'x-osdu-inheriting-from-kind' && 
        //     p[0] !== 'additionalProperties'  
        // ) && p ).filter(Boolean)  
        // if (!debug) console.log('29 ConvertJSONToModels', osduSchemaProps);

        // const osduSchemaProperties = osduModel.schema.properties
        // const schemaPropertiesProps = Object.entries(osduSchemaProperties) // iterate properties and make array
        // if (!debug) console.log('30 ConvertJSONToModels', schemaPropertiesProps);
        
        // // console.log('47, ConvertJSONToModel', osduSchemaProps1.map(p => (`["${p[0]}", { "${p[1]}" } ]`)));
        
        
        // const osduSchemaProps2  = osduSchemaInfoProps1.map(p => JSON.parse(`[ "${p[0]}", { "value": "${p[1]}" } ]`))
        // const schemaObject = fillObject(osduSchemaProps2, propertyTypeId, 'Property', false);
        // if (schemaObject) props.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: schemaObject }); 
        

        
        
        // if (!debug) console.log('68 ConvertJSONToModels', osduSchemaIdentityProps1);
        // if (!debug) console.log('69 ConvertJSONToModels', osduSchemaIdentityProps);
        // if (!debug) console.log('70 ConvertJSONToModels', schemaIdentityObject);

        // // system properties
   
        // // const systemPropertyObjects = schemaProperties.map(p => (p[0] !== 'data') && fillObject(schemaProperties, propertyTypeId, 'Property', false);
        // // if (systemPropertyObjects)  props.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: systemPropertyObjects }); 
        
        // // // data  properties
        // // const osduDataProperty = schemaPropertiesProps.filter(p => (p[0] === 'data') && p[1]);
        // // const osduAllOfProperty = osduDataProperty[0][1].allOf;
        // // const osduTypeProps = osduAllOfProperty.filter(p => ((!p.properties?.ExtensionProperties && p.type === 'object') && p.properties));
        // // const osduProps1 = osduTypeProps[0]
        // // const osduProperties = Object.entries(osduProps1.properties)
        // // const oPropertyObjects = osduProperties.map(p => (!p[1]['x-osdu-relationship']) && fillObject(p, '6ca3e143-bb47-4533-4ed0-0e9e0f8bb0c4', 'Property', false)).filter(Boolean);
        // // if (oPropertyObjects)       oPropertyObjects.map(p =>       props.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: p }));
        
        // // data relationships
        // // const oRelshipProperties = osduProperties.map(p => (p[1]['x-osdu-relationship']) && fillObject(p, '6ca3e143-bb47-4533-4ed0-0e9e0f8bb0c4', 'Property', false)).filter(Boolean);

        // if (debug) console.log('53 ConvertJSONToModels', schemaProperties.map(p => p));
        // if (debug) console.log('54 ConvertJSONToModels', systemPropertyObjects);



        
    };
    reader.readAsText(e.target.files[0])
  }