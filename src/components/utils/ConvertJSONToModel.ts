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
        
        const osduModel = {'osdu-master-data': JSON.parse(text)}
        if (!debug) console.log('11 convertJSONToModels',  osduModel);
        let parentName = 'osdu-master-data'
        let parentId = 'osdu-master-data'
        let grandparentName = 'osdu-master-data'
        // let id = utils.createGuid();

        console.log('15', parentName, parentId);
        
        // function to find a object with name = matchingTitle
        // NB! for now its hardcoded and if x-osdu-relationship does not exist it returns null
        function searchTree(element, matchingTitle){
            console.log('25 aaa', element, matchingTitle, element["x-osdu-relationship"]);
            
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
        //called with every property and its value
        function process(key,value) {
            
            // const tkey = String(key).replace(/\$id/g, 'id')
            const tval = String(value).replace(/"/g, '')
            const attributeJSON = `"${key}" : "${tval}"`;
            return attributeJSON
        }
        let objectPath = ["osdu-master-data"]
        let objectIdPath = ["osdu-master-data"]
        
        // traversing the JSON tree to extract all objects and dispatch
        //-----------------------------------------------------------------------------------------------------
        function traverse(o,func) {

            const id = utils.createGuid();
            console.log('49', objectPath);
            const TypeId = (objectPath[objectPath.length - 2] === "properties") ? propertyTypeId : informationTypeId
            let importedObjects = `
            "id": "${id}",
            "name": "${objectPath[objectPath.length - 1]}", 
            "typeRef": "${TypeId}",
            "abstract": false,
            "viewkind": "",
            "markedAsDeleted": false,
            "generatedTypeId": "",
            "modified": false  
        `  
       // if parent object make a hasPart relationship
       if (parentId) {
           const relship = {
            cardinality: "",
            cardinalityFrom: undefined,
            cardinalityTo: undefined,
            description: "",
            fromobjectRef: parentId,
            generatedTypeId: "",
            id: utils.createGuid(),
            markedAsDeleted: false,
            modified: true,
            name: "hasPart",
            relshipkind: "",
            relshipviews: undefined,
            title: "",
            toobjectRef: id,
            typeRef: "857f3fea-ed22-4e5d-7072-c998d180163d",
           }
        console.log('65 relship', parentId, parentName, relship, id, objectPath[objectPath.length - 1]);
        if (relship) props.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: relship });
        
    }

            console.log('61', o, o[0],parentId, importedObjects);
            
            for (var i in o) {

                console.log('62', objectPath);
                parentName = objectPath[objectPath.length - 2]

                // if (Object.keys(o[i])[0] !== "0") console.log('65',Object.keys(o[i])[0])                     
                if (o[i] !== null && typeof(o[i]) === "object") {
                    // create new object
                    objectPath.push(i)
                    const id = utils.createGuid();
                    objectIdPath.push(id)
                    //going one step down in the object tree!!
                    // console.log('68', grandparentName, parentName, i, o[i]);
                    // grandparentName = parentName
                    parentId =  id
                    parentName = objectPath[objectPath.length - 1]
                    // console.log('74', parentName, parentId);   
                    traverse(o[i],func);              
                } else {
                    if (i === "id")  continue; // drop for now
                    if (i === "$ref")  continue; // drop for now
                    if (importedObjects.name === "x-osdu-relationship")  continue; // drop for now
                    if (parentName === "required")  continue; // drop for now
                    if (parentName === "additionalProperties")  continue; // drop for now
                    if (parentName === "x-osdu-inheriting-fromkind")  continue; // drop for now

                    // chencking if a relationship is defined. We dont have the other end. We can make a temporary object?
                    if (searchTree(o, 'x-osdu-relationship') !== null) {
                        console.log('97 relship tobe created', o["x-osdu-relationship"]);
                        // if (relatedObj) props.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: relatedObj });
                        // if (relationship) props.dispatch({ type: 'UPDATE_RELATIONSHIP_PROPERTIES', data: relationship });
                        continue;
                    };
                    
                    importedObjects += ' ,'+func.apply(this,[i,o[i]])+''                      
                    console.log('76', grandparentName, parentName, importedObjects)
                   
                }                
                objectPath.pop()
            }
            // parentName = owner
            // console.log('95', owner);
            const impObjJSON =  importedObjects.replace(/\\/g, '\\\\')
            // console.log('95', impObjJSON);
            const impObjStr = '{'+impObjJSON+'}'
            // console.log('99', impObjStr)
            
            const impObj = JSON.parse(impObjStr)
            // console.log('101', impObj, parentName)
             if (impObj && (
                 impObj.name !== "0" &&  impObj.name !=="1" && impObj.name !== "2" && impObj.name !== "3" &&  impObj.name !=="4")) 
                 props.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: impObj });
        }

        //that's all... no magic, no bloated framework
        // traverse(osduModel, process);
        traverse(osduModel["osdu-master-data"], process);
        



















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