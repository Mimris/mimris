// @ts-nocheck

import * as utils from '../../akmm/utilities';

// read and convert OSDU Json format
        const informationTypeId = '6bab35bb-f339-4ca0-f458-6c0cb7d0d302'
        const propertyTypeId = '6ca3e143-bb47-4533-4ed0-0e9e0f8bb0c4' 
        const hasPartTypeId = '0c2653b4-f201-48bb-d738-75d97de01d36'
        const hasMemberTypeId = "6d6aa1f9-4f2b-44f4-c009-65b52490bf22"

export const ReadConvertJSONFromFile = async (props, dispatch, e) => {
    e.preventDefault()
    const reader = new FileReader()

    // reader.fileName = file.name
    reader.onload = async (e) => { 
        const text = (e.target.result)
        const osduMod = JSON.parse(text) // importert JSON file
        const topName = "json"+osduMod.title
        const topModel ={[topName]: osduMod} // top object is given topName as key 

        function deepEntries( obj ){
            'use-strict';
            var allkeys, curKey = '', len = 0, i = -1, entryK;
        
            function formatKeys( entries ){
               entryK = entries.length;
               len += entries.length;
               while (entryK--)
                 entries[entryK][0] = curKey+JSON.stringify(entries[entryK][0])+'-';
               return entries;
            }
            allkeys = formatKeys( Object.entries(obj || {}) );
        
            while (++i !== len)
                if (typeof allkeys[i][1] === 'object' && allkeys[i][1] !== null){
                    curKey = allkeys[i][0]+ '';
                    // curKey = allkeys[i][0] + '[';
                    Array.prototype.push.apply(
                        allkeys,
                        formatKeys( Object.entries(allkeys[i][1]) )
                    );
                    console.log('35 :', curKey, curKey.slice(0, -1), allkeys[i][1]);
                    // console.log('35 :', i, entryK, len, curKey.slice(0, -1), allkeys[i][1]);
                    const cKey = curKey.slice(0, -1).replace(/"/g, '')
                    const pKey = cKey.split('-').slice(0, -1).join('-')
                    const ppKey = pKey.split('-').slice(-1)[0]
                    console.log('47', pKey.split('-'), pKey.split('-').slice(0, -1));
                    
                    const cName = cKey.split('-').slice(-1)[0]
                    const cVal =  allkeys[i][1] 
                    console.log('36 :', cKey, 'pKey', pKey, 'ppKey', ppKey, 'cName :', cName, 'cVal:', cVal);

                    const cNewVal = filterObject(cVal)
                    // console.log('43 :', allkeys[i][0], cNewVal );
                    const typeRef = (ppKey === "properties") ? propertyTypeId : informationTypeId 
                    const importedObject = {
                        id: cKey,
                        name: cName,
                        typeName: "Information",
                        typeRef: typeRef,
                        abstract: false,
                        markedAsDeleted: false,
                        modified: true,
                        ...cNewVal
                    }
                    // console.log('58 :', importedObject);
                    
                    dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: importedObject } );  
                    

                    const importedRel = {
                        cardinality: "",
                        cardinalityFrom: undefined,
                        cardinalityTo: undefined,
                        description: "",
                        fromobjectRef: pKey,
                        generatedTypeId: "",
                        id: utils.createGuid(),
                        markedAsDeleted: false,
                        modified: true,
                        name: "hasPart",
                        relshipkind: "",
                        relshipviews: undefined,
                        title: "",
                        toobjectRef: cKey,
                        typeRef: hasPartTypeId,
                    }

                    console.log('87 :', importedRel);

                    dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: importedRel });
                }
            return allkeys;
        }

        // console.log('39  :',
            deepEntries(topModel)
        // ) 
        function stringifyEntries(allkeys){
            return allkeys.reduce(function(acc, x){
                return acc+((acc&&'\n')+x[0])
            }, '');
        };
        // console.log('56 :', stringifyEntries(deepEntries(topModel))); 
    };

    reader.readAsText(e.target.files[0])
  }
  function filterObject(obj) {
    let newobj = {}
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') continue;
        newobj = {
            ...newobj,
            [i]: obj[i]
        }
        console.log('75', i, obj[i], newobj);
        
    }
    console.log('76 :', obj, newobj);
    
    return newobj;
}





          function process(key,value) { //called with every property and its value
              // if (key === "id") key = "$id"  // We will use our own uuid so rename if source has id
              // if (key === 'name' && (!value))  key = "contryName"
              const attribute = {[key]:value}
              return attribute
          }





// import React, { useState, useEffect } from "react";
// import * as utils from '../../akmm/utilities';

// const debug = false

// // function to find a object with name = matchingTitle
// // NB! for now its hardcoded and if x-osdu-relationship does not exist it returns null
// function searchTree(element, matchingTitle){
//     // console.log('19', element, matchingTitle, element["x-osdu-relationship"]);
//     if(element["x-osdu-relationship"]){
//             return element;
//     }else if (element.children != null){
//             var i;
//             var result = null;
//             for(i=0; result == null && i < element.children.length; i++){
//                 result = searchTree(element.children[i], matchingTitle);
//             }
//             return result;
//     }
//     return null;
// }

// // read and convert OSDU Json format
// export const ReadConvertJSONFromFile = async (props, dispatch, e) => {
//     e.preventDefault()
//     const reader = new FileReader()
//     // reader.fileName = file.name
//     reader.onload = async (e) => { 
//         const text = (e.target.result)
//         const osduMod = JSON.parse(text) // importert JSON file
        
//         // $id for osdu Authoring json, ["x-osdu-schema-source"] for selfcontained files 
//         const osduSchemaSource = (osduMod["$id"]) ? osduMod["$id"] : osduMod["x-osdu-schema-source"] // adding text to top object to get uniqe name if import of different files

//         const topObjName = osduSchemaSource
//         const osduModel = {[topObjName]: osduMod } // top object is given topName as key 
//         const topName = "json"
//         const topModel ={[topName]: osduModel} // top object is given topName as key 
 
        

//         // define a modelview from shemaInfo and identiy
//         // const osduSchemaModelview = {
//         //     id: osduModel.schemaInfo.schemaIdentity.id,
//         //     name: osduModel.schemaInfo.schemaIdentity.entityType,
//         //     description: osduModel.schemaInfo.schemaIdentity.authority,
//         // }

//         const informationTypeId = '6bab35bb-f339-4ca0-f458-6c0cb7d0d302'
//         const propertyTypeId = '6ca3e143-bb47-4533-4ed0-0e9e0f8bb0c4' 
//         const hasPartTypeId = '0c2653b4-f201-48bb-d738-75d97de01d36'
//         const hasMemberTypeId = "6d6aa1f9-4f2b-44f4-c009-65b52490bf22"
        
//         function process(key,value) { //called with every property and its value
//             // if (key === "id") key = "$id"  // We will use our own uuid so rename if source has id
//             // if (key === 'name' && (!value))  key = "contryName"
//             const attribute = {[key]:value}
//             return attribute
//         }

//         const initNewObj = (objectName, ancestryPath, typeRef) => { // set up new object with some initial attributes
//             const ancestryPathStr = ancestryPath.toString()
//             // const osduIdPath = (ancestryPath) 
//             //     ? (parentName) ? ancestryPath+'::'+parentName+'::'+objectName : ancestryPath+'::'+objectName 
//             //     : objectName
  
//             console.log('65 : ', ancestryPath, ancestryPathStr, objectName );

//             return  {
//                 // id: utils.createGuid(),
//                 // id: (parentName === 'properties') ? objectName : osduIdPath, // in Osdu objectname is unique
//                 id: ancestryPathStr+'::'+objectName, // in Osdu objectname is unique
//                 name: objectName,
//                 typeRef: typeRef,
//                 abstract: false,
//                 viewkind: "",
//                 markedAsDeleted: false,
//                 generatedTypeId: "",
//                 modified: false
//             }
//         };     

//         const initNewRelship = (typeRef, objectName, fromObjRef, toObjRef) => { // set up new relship with some initial attributes
//             return {
//                 cardinality: "",
//                 cardinalityFrom: undefined,
//                 cardinalityTo: undefined,
//                 description: "",
//                 fromobjectRef: fromObjRef,
//                 generatedTypeId: "",
//                 id: utils.createGuid(),
//                 markedAsDeleted: false,
//                 modified: true,
//                 name: objectName,
//                 relshipkind: "",
//                 relshipviews: undefined,
//                 title: "",
//                 toobjectRef: toObjRef,
//                 typeRef: typeRef,
//             }
        
//         }

//         // Create AKMM object of the Json-object
//         const createObj = (sourceObject, currentName, parentObj, ancestryPath, nameAttr, listName, list, func) => { 
//             const typeRef = (parentObj.name === "properties") ? propertyTypeId : informationTypeId    
//             console.log('107 : ', sourceObject, currentName, parentObj, ancestryPath);
             
//             // init new Object   
//             const newObj = initNewObj(currentName, ancestryPath, typeRef) 
//             // const newObj = {[currentName]: initNewObj(currentName, ancestryPath, typeRef) }
//             console.log('112 :', newObj);
            
//             // if parent object make a hasPart relationship
//             // init new relationship
//             const newRel = (parentObj.id && newObj.id) && initNewRelship(hasPartTypeId, " hasPart", parentObj.id, newObj.id) 
//           return  {newObj, newRel}
//         }

//         // traversing the JSON tree to extract all objects and dispatch
//         //-------- currentObj, parentObj, rel, parentName, nameAttribute, name-of-key-of-the-object-containing-the-lst, userinputlist-of-objects, process --------------------------------------------------
//         function traverse(o, parentObj, parRel, ancestryPath, nameAttr, listName, list, func) { // o = current object
//             let newO = {}
            
//             console.log('119 : ', o, parentObj, parRel, ancestryPath, nameAttr, listName, list);
//             const parentName = parentObj.name
            
//             let importedObject
//             for (var i in o) { // i = child in current object
//                 let  attributes, newObject       
//                 console.log('133 :', o, o[i]);
                
//                 if (o[i] !== null && typeof(o[i]) === "object" ) { 
//                     console.log('136 :', o[i]);
//                     // ancestryPath.push(parentName) // add current parent to ancestryPath
//                     console.log('124 :', ancestryPath);
                    
//                     const sourceObj = o[i]
//                     let sourceObjName = (sourceObj[`${nameAttr}`]) ? i+': '+sourceObj[`${nameAttr}`] : i                    
//                     if (!list) { // if list is not given, create all
//                         console.log('131 : ', sourceObj, sourceObjName, parentObj, ancestryPath, nameAttr, listName, list);
//                         newO = createObj(sourceObj, sourceObjName, parentObj, ancestryPath, nameAttr, listName, list, func)    // sourceobject, sourceObj name, parentobject
//                         console.log('145 :', newO.newObj);
                        
//                     } else if (listName !== parentName) { // if parent is listname create object
//                         if (debug) console.log('137 : ', listName, list, sourceObj, sourceObj[`${nameAttr}`]);
//                         newO = createObj(sourceObj, sourceObjName, parentObj, ancestryPath, nameAttr, listName, list, func)    // sourceobject, sourceObj name, parentobject 
//                     } else { // if list includes name create object
//                         if (list.includes(sourceObj[`${nameAttr}`])) {   
//                             newO = createObj(sourceObj, sourceObjName, parentObj, ancestryPath, nameAttr, listName, list, func)    // sourceobject, sourceObj name, parentobject 
//                         }
//                     }
//                     newObject = newO.newObj

//                     // } else if (searchTree(o, 'x-osdu-relationship') !== null) { // new relationship making offpage object to link to other end
//                     console.log('158 : ', newO.newObj);
//                     // // i er objectName
//                     // createObj(o[i], i, parentObj, func)
//                     // -------
//                     if (!debug) console.log('113 :', newObject, sourceObj, newObject, ancestryPath);    
//                     // ------currentObj, parentObj, rel, ancestryName, nameAttribute, name-of-key-of-the-object-containing-the-lst, userinputlist-of-objects, process-----------------------------------         
//                     traverse(newO, sourceObj, newObject.newRel, ancestryPath, nameAttr, listName, list, func);  //going one step down in the object tree!!   
//                     // -------      


//                 } else {
                    
//                     const attribute = func.apply(this, [i, o[i]])                     
//                     console.log('159 : ', i, o[i], attribute);
//                     // importedObjects += ' ,'+func.apply(this,[i,o[i]])+''                      
//                     attributes = {
//                         ...attributecoll,
//                         ...attribute,
//                     }   
//                     const attributecoll = attributes
//                     console.log('172 ;', attributecoll);
                    
//                 }
                
//                 importedObject = {
//                     ...newObject,
//                     ...attributes,
//                 }   
//                 console.log('178 :', importedObject);
                
//             }   
  

 
            
//             if (!debug) console.log('165 for : ', importedObject);   
//             if (importedObject && importedObject.name !== undefined) 
//                 props.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: importedObject }
//             );  
//             // importedObject.name !== "0" &&  importedObject.name !=="1" &&
//             // importedObject.name !== "2" && importedObject.name !== "3" &&  importedObject.name !=="4") &&
//             if (!debug) console.log('169 ----- : ', parRel);   
//             if (parRel && parRel.id !== undefined) props.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: parRel });

//             console.log('200 :'. ancestryPath);
//             ancestryPath.pop()

//             console.log('203 :'. ancestryPath);
            
//         }

        
//         const currentObj = topModel;
//         let parentObj = {};
//         const rel = null;
//         let nameAttribute = ""
//         let ancestryPath = [topName];
//         let parentId = topName
//         let attrnam, oList, listnam, list = null, listName
//             // const listName = prompt("Type in the name of the list (leave blank if nothing):", listnam);
//             // const list = prompt("Type a list of objects (delimited with ,) (leave blank if nothing", oList);
//             // nameAttribute = prompt("Type in the attribute to be used as Name (leave blank if nothing):", attrnam);
//         let listwithtop= (list !== null) && list + ",json, country" // top object must be included
//         let objList = (listwithtop) ? listwithtop.split(",") : null;
//         // ancestryPath.push(parentId) //Path to keep order of where we are in the structure

        
//         // traverse the JSON file (
//             // currentObj = object to be traversed recursively, 
//             // parentObj = parent of current object, if parent is "properties" create propertytype else information type
//             // rel = current partOf relationship from parent to current
//             // ancestryPath = concatination of traversed object to get an unique name, 
//             // nameAttribute used to select if an array should be filtered
//             // listNamename keyname-of-the-object-containing-the-lst, 
//             // userinputlist the comma delimited list of objects to be filtered,
//             // process callback for recursiv action);
//             console.log('169 :', currentObj, parentObj, rel, ancestryPath, nameAttribute, listName, objList);
//         traverse(currentObj, parentObj, rel, ancestryPath, nameAttribute, listName, objList, process);
        
//     };
//     reader.readAsText(e.target.files[0])
//   }