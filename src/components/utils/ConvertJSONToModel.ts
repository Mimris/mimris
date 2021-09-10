// @ts-nocheck

const debug = false
import * as utils from '../../akmm/utilities';
import ObjectTable from '../table/ObjectTable';

// read and convert OSDU Json format


export const ReadConvertJSONFromFile = async (modelType, inclProps, props, dispatch, e) => {
    e.preventDefault()
    const reader = new FileReader()

    // const JsonObjectTypeId = ['379e9cf8-4481-4b1c-cd09-04924edb97d6', 'JsonObject']
    // const JsonArrayTypeId = ['ca4b9d54-a585-4415-aa1b-e259c375c74f', 'JsonArray']
    // const entityTypeId = ['31a18ce8-66cf-4b95-79e4-673746867ac3', 'EntityType']
    // const propertyTypeId = ['7e9386c9-75bc-4239-c040-d328f1c91e1b','Property']
    // const hasPartTypeId = ['1507e682-1a4f-49cb-efe7-b2efcb3eb50c','hasPart']
    // const hasMemberTypeId = ['40bd8511-8daf-452c-2e01-3bb3f4f0277c', 'hasMember']
    // const hasTypeId = ['22f50fa8-90be-4738-8f71-670a19668fe0', 'has']



    const curModel = props.phData.metis.models.find(m => m.id === props.phFocus.focusModel.id)
    console.log('23 ', props.phFocus.focusModel, curModel, props.phData.metis.models);
    
    const curMetamodel = props.phData.metis.metamodels.find(mm => mm.id === curModel.metamodelRef)
    const curObjTypes = curMetamodel.objecttypes
    const curRelTypes = curMetamodel.relshiptypes

    const JsonObjectType = curObjTypes.find(co => (co.name === 'JsonObject') && co)
    
    const JsonArrayType = curObjTypes.find(co => (co.name === 'JsonArray') && co)
    const entityType = curObjTypes.find(co => (co.name === 'EntityType') && co)
    const propertyType = curObjTypes.find(co => (co.name === 'Property') && co)
    const hasPartType = curRelTypes.find(co => (co.name === 'hasPart') && co)
    const hasMemberType = curRelTypes.find(co => (co.name === 'hasMember') && co)
    const hasType = curRelTypes.find(co => (co.name === 'has') && co)
    console.log('38', hasPartType);
    
    // console.log('32 ', JsonObjectType.id, hasPartType.id, hasMemberType.id, hasType.id);
    let objecttypeRef = JsonObjectType?.id // default partof relship in JSON structure
    let reltypeRef = hasPartType?.id // default partof relship in JSON structure
    let reltypeName = hasPartType?.name // default partof relship in JSON structure

    // reader.fileName = file.name
    reader.onload = async (e) =>  { 
        const text = (e.target.result)
        const osduMod = JSON.parse(text) // importert JSON file
        if (debug) console.log('32', osduMod,  osduMod["$id"], osduMod["x-osdu-schema-source"] );
        // if (osduMod["$id"]) console.log('20',  osduMod["$id"].split('/').slice(-1)[0]  );
        
        const topName = (osduMod["$id"]) ? osduMod["$id"].split('/').slice(-1)[0] : osduMod["x-osdu-schema-source"] 
        const topModel ={[topName]: osduMod} // top object is given topName as key 

        let parentId = null //topModel.id || osduMod["$id"]
        let oldParentKey = ""
        let prevId = ""
        let tmpArray = []
        let entityId = ""
        let parentIdArray = []
        let importedObject, topLevelObjectId, entityName
        let reltRef, importedRel, relDescription, relTitle
        let fromobjectId, fromobjectName, toobjectId, toobjectName

        // deepEntries take all object-keys and concatinate them in curKey with a path showing all above levels
        // the curKey is put in a array "allKeys" with curKey as first and the obect as second. 
        function deepEntries( obj ) {
            'use-strict';
            var allkeys, curKey = '', nextKey= '',len = 0, i = -1, entryK;
            if (debug) console.log('deepEntries', obj);
            function formatKeys( entries ){
               entryK = entries.length;
               len += entries.length;
               while (entryK--)
                 entries[entryK][0] = curKey+JSON.stringify(entries[entryK][0])+'|'; // concatinate curKey with | as divider
               return entries;
            }
            allkeys = formatKeys( Object.entries(obj || {}) )
            allkeys = allkeys.sort((firstItem, secondItem) => firstItem.key < secondItem.key);
            
            if (!debug) console.log( '59 allkeys : ', allkeys);

            // iterate over all objects allKeys is an array with [key, value] where key is the Json-object-path and value is the object
            // the key is the path to the object in the JSON-file and the value is the object itself 
            while (++i !== len)
                if (typeof allkeys[i][1] === 'object' && allkeys[i][1] !== null){ // It is an Json structure key as with an object 
                    curKey = allkeys[i][0]+ '';
                    nextKey = (allkeys[i+1]) ? allkeys[i+1][0]+ '' : '';
                    const jsonType = (Array.isArray(allkeys[i][1])) ? 'isArray' : 'isObject';
   
                    Array.prototype.push.apply(
                        allkeys,
                        formatKeys( Object.entries(allkeys[i][1]) )
                    );
                    // console.log('35 :', i, entryK, len, curKey.slice(0, -1), allkeys[i][1]);

                    // make a unique osduId for each object in the JSON-file by concatinating the path to the object with the name its keys
                    // clean up the key path by removing the " in "key" first
                    const cleanPath = curKey.slice(0, -1).replace(/"/g, '') // clean key path ; remove "" from curkey to get a clean key string with the path as curKey
                    const cleanNextPath = nextKey.slice(0, -1).replace(/"/g, '') // clean key path ; remove "" from curkey to get a clean key string with the path as curKey

                    let osduId =  cleanPath
                    let newosduId
                    let newIdArray = osduId.split('|') // make an array of all keys in the path

                    if  (osduId.includes("|definitions")) { // this is within osdu Json structure if definitions key is found
                        const [, ...rest] = newIdArray
                        newosduId = rest.join('|')
                    } else {
                        newosduId = osduId
                    } // split and slice it, pick last element 
                    // if  (osduId.includes("|definitions|")) osduId = osduId.split('|').slice(-1)[0] // split and slice it, pick last element 
                    // console.log('60 :', newosduId);
                    
                    let oKey = newosduId // newosduId is the key for the object in the JSON-file if it has definitions key

                    const oName = oKey.split('|').slice(-1)[0] // objectName ; split and slice it, pick last element 
                    const parentKey = oKey.split('|').slice(0, -1).join('|') // parent path ; split and slice it, pick all exept last element and rejoin
                    let parentName = parentKey.split('|').slice(-1)[0] // parentName ; split and slice it, pick last element 
                    // console.log('53', parentKey.split('|'), parentKey.split('|').slice(0, -1));
                    
                    const oVal =  allkeys[i][1] // the object
                    // console.log('57 :', '\n cleanPath: ', cleanPath, '\n oKey: ', oKey, '\n parentKey: ', parentKey, '\n parentName: ', parentName, '\n oName : ', oName, '\n oVal: ', oVal, '\n parentId: ', parentId);
 
                    let cNewVal = filterObject(oVal)// we only want attributes (objects are handled in the next iteration)

                    if (oName === 'required')  { // special case for required. a list of properties that is required
                        const attributes  = Object.assign(...Object.entries(obj).map(([k, v]) => (k !== (!isNaN(k))))); 
                        cNewVal = {...attributes, 'propNames': Object.values(oVal).toString()}
                    }
                    if (debug) console.log('93 : oKey', oKey, oName, '\n oVal : ', oVal,'\n cNewVal : ', cNewVal);

                    // this shoul be replaced by a list of types that create EtityTypes etc.
                    const objTypeName = (parentName === 'properties') 
                        ? 'Property'
                        : (oName === 'allOf' || oName === 'anyOf' || oName === 'oneOf' || oName === 'required') 
                            ? 'JsonArray'
                            : (modelType === 'AKM')
                                ? (i === 0) 
                                    ? 'EntityType'
                                    : (oName === 'items') 
                                        ? 'EntityType' 
                                        : 'JsonObject'
                                : 'JsonObject'

                    objecttypeRef = curObjTypes.find(ot => ot.name === objTypeName)?.id // find objecttypeRef for the objecttypeName

                    if (debug) console.log('115 : ', objTypeName, ' - ', objecttypeRef);
                    
                    // objecttypeRef = (parentName === "properties") ? propertyType.id : (oName !== "allOf") ? JsonObjectTypeId : JsonArrayTypeId // if parent is property use property typeRef
                    // console.log('102 : ', parentName, oName, objecttypeRef);
                    
                    let compositeName  = oName // temporary puttin title etc into objname for readability - later replace with a JSON - objecttype for the object

                    reltypeRef = (parentName === 'allOf' || parentName === 'anyOf' || parentName === 'onOf')  ? hasMemberType?.id : hasPartType?.id // temporary set array to hasMember relship
                    if (debug) console.log('110', parentName, reltypeRef.id);
                    
                    // check if the object is already in the phData
                    console.log('102 : props', props, 'curModel ', curModel);
                    const existObj = curModel.objects.find( (o) => o.osduId === oKey )
                    console.log('106 : ', existObj, oKey, existObj?.id);
                    
                    const oId = (existObj) ? existObj.id : utils.createGuid()
                    tmpArray = [...tmpArray, [oKey, oId] ]
                    // console.log('139 ', tmpArray);           
                    
                    // ---------------------------------------------------------------------------------------------------------------------------------------
                    
                    
                    if (modelType === 'AKM') { // if AKM then just create the top level object with title as name + properties
                        
                        if (i === 0 || oName === 'items')  {

                            const parentName = parentKey.split('|').slice(-1)[0] // parentName ; split and slice it, pick last element 
                            parentId = (i !== 0) && oId // set parentId to be used in the next iteration of  objectet.
                            // console.log('163', i, parentName,);
                            entityName = (i === 0) ? cNewVal.title : oName // if topobject use title as name
                            // entityName = (i === 0) ? cNewVal.title : (oName === 'items') ? parentName : oName // if topobject use title as name
                
                            // console.log('142 i', i, entityName, entityId);
                            reltypeRef = hasType.id 
                            reltypeName = hasType.name

                            importedObject = createObject(oId, entityName, objecttypeRef, oKey, jsonType, cNewVal)

                            // importedObject = { //the imported object to be created as AKM object
                            //     id: oId,
                            //     name: entityName,
                            //     // typeName: type,
                            //     typeRef: objecttypeRef,
                            //     abstract: false,
                            //     markedAsDeleted: false,
                            //     modified: true,
                            //     osduId: oKey,
                            //     ...cNewVal // want only attributes 
                            // }

                        } else if (oName === 'properties') {
                            
                            reltypeRef = hasPartType.id
                            reltypeName = hasPartType.name             
                            
                            entityName = (i === 0) ? cNewVal.title : (oName === 'items') ? parentName : oName
                            parentId = entityId
                            entityId = oId
                            compositeName = (entityName) ? entityName : oName

                            importedObject = {
                                id: oId,
                                name: entityName,
                                // typeName: type,
                                typeRef: objecttypeRef,
                                abstract: false,
                                markedAsDeleted: false,
                                modified: true,
                                osduId: oKey,
                                ...cNewVal // want only attributes 
                            }

                        } else if (parentName === 'properties' && inclProps) { // if include properties

                            if (debug) console.log( '158 : ', compositeName, oId, parentId, entityId, parentName, tmpArray);
                            reltypeRef = hasType.id
                            reltypeName = hasType.name             
                            parentId = entityId
                            compositeName = (entityName) ? entityName : oName
                
                                importedObject = {
                                    id: oId,
                                    name: compositeName,
                                    // typeName: type,
                                    typeRef: objecttypeRef,
                                    abstract: false,
                                    markedAsDeleted: false,
                                    modified: true,
                                    osduId: oKey,
                                    ...cNewVal // want only attributes 
                                }
            
                        } else {
                            
                            continue;
                        }
                        parentIdArray = tmpArray.find( (o) => (o[0] === parentKey) && o) ;
                        parentId = (parentId === oId) 
                            ? null
                            : (!parentId) 
                                ? null 
                                : (entityId) 
                                    ? entityId 
                                    : parentIdArray[1] 

                    } else {   // create the json objects 
                        // parentId = oId
                        importedObject = {
                            id: oId,
                            name: compositeName,
                            // typeName: type,
                            typeRef: objecttypeRef,
                            abstract: false,
                            markedAsDeleted: false,
                            modified: true,
                            osduId: oKey,
                            jsonType: jsonType,
                            jsonKey: oName,
                            ...cNewVal // want only attributes 
                        }
                        parentIdArray = tmpArray.find( (o) => (o[0] === parentKey) && o) ;
                        parentId = (parentIdArray) && parentIdArray[1]
                    }
                    if (!debug) console.log('58 :', importedObject, parentId);

                    dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: importedObject } );  



                    // parentId = (entityId) ? entityId : (parentId) ? parentIdArray[1] : null  
                    parentName = (entityName) ? entityName : parentName 
                    
                    if (!debug) console.log('243 : name', compositeName, 'oId ',oId, 'parentId ', parentId, 'entityId ', entityId, 'reltRef ', reltypeRef);
                    const relId = utils.createGuid(),
                    importedRel  = createRel(relId, reltypeName, relDescription="", relTitle="", reltypeRef, entityId, fromobjectName, toobjectId, toobjectName)

                    // importedRel = (parentId) 
                    //     ?   {
                    //             id: utils.createGuid(),
                    //             name: reltypeName,
                    //             title: "",
                    //             cardinality: "",
                    //             cardinalityFrom: undefined,
                    //             cardinalityTo: undefined,
                    //             description: "",
                    //             fromobjectRef: entityId,
                    //             nameFrom: parentName,
                    //             generatedTypeId: "",
                    //             // id: parentKey+oKey,
                    //             markedAsDeleted: false,
                    //             modified: true,
                    //             relshipkind: "",
                    //             relshipviews: undefined,
                    //             toobjectRef: oId,
                    //             nameTo: oName,
                    //             typeRef: reltypeRef,
                    //         }  
                    //     :   {}

                        entityId = oId // remember entity id to be used in the next iteration of property  sub objectet.
 
                    if (debug) console.log('234 ', importedRel );
                    
                    (parentId) && dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: importedRel });

                    if (debug) console.log('129 ',
                        '\n oldParKey :', oldParentKey,  
                        '\n parKey : ', parentKey, 
                        '\n parName : ', parentName, 
                        '\n parId : ', parentId, 
                        '\n prevId : ', prevId,
                        '\n curId : ', oId,
                        '\n curName : ', oName);

                  

                   prevId = oId     
                   oldParentKey = parentKey // remember for next object
                }
            return allkeys;
        }

        deepEntries(topModel) // find all the objects in the topModel and down the tree

        function stringifyEntries(allkeys){
            return allkeys.reduce(function(acc, x){
                return acc+((acc&&'\n')+x[0])
            }, '');
        };
        // console.log('56 :', stringifyEntries(deepEntries(topModel))); 
    };

    reader.readAsText(e.target.files[0])
  }

     const createObject = (oId, oName, otypeRef, oKey, jsonType, cNewVal) => {

        return {
            id: oId,
            name: oName,
            // typeName: type,
            typeRef: otypeRef,
            abstract: false,
            markedAsDeleted: false,
            modified: true,
            osduId: oKey,
            jsonType: jsonType,
            jsonKey: oName,
            ...cNewVal // want only attributes 
        }

    }

    const createRel = (relId, typeName, description, title, reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName) => {
                            
        importedRel = (parentId) 
        ?   {
                id: relId,
                name: typeName,
                title: title,
                cardinality: "",
                cardinalityFrom: undefined,
                cardinalityTo: undefined,
                description: description,
                fromobjectRef: fromobjectId,
                nameFrom: fromobjectName,
                generatedTypeId: "",
                // id: parentKey+oKey,
                markedAsDeleted: false,
                modified: true,
                relshipkind: "",
                relshipviews: undefined,
                toobjectRef: toobjectId,
                nameTo: oName,
                typeRef: reltypeRef,
            }  
        :   {}

    }

  // filter to get only attributes (objects removed)
  function filterObject(obj) {
    let newobj = {}
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') continue;
        const tmpkey = i
        if (i === 'type') tmpkey = 'osduType' // type is a akmm attribute probably not the same as osdu attribute

        newobj = {
            ...newobj,
            [tmpkey]: obj[i]
        }
        // console.log('130', i, obj[i], newobj);
    }
    // console.log('132 :', obj, newobj);
    
    return newobj;
}

function process(key,value) { //called with every property and its value
    // if (key === "id") key = "$id"  // We will use our own uuid so rename if source has id
    // if (key === 'name' && (!value))  key = "contryName"
    const attribute = {[key]:value}
    return attribute
}


