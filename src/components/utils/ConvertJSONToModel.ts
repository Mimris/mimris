// @ts-nocheck

const debug = false
import * as utils from '../../akmm/utilities';
import ObjectTable from '../table/ObjectTable';

// read json file and convert OSDU Json format to AKM model
export const ReadConvertJSONFromFile = async (modelType, inclProps, props, dispatch, e) => {
    e.preventDefault()
    const reader = new FileReader()

    const curModel = props.phData.metis.models.find(m => m.id === props.phFocus.focusModel.id)
    if (debug) console.log('23 ', props.phFocus.focusModel, curModel, props.phData.metis.models);
    
    const curMetamodel = props.phData.metis.metamodels.find(mm => mm.id === curModel.metamodelRef)
    const curObjTypes = curMetamodel.objecttypes
    const curRelTypes = curMetamodel.relshiptypes

    const JsonObjectType = curObjTypes.find(co => (co.name === 'JsonObject') && co)
    
    const containerType = curObjTypes.find(co => (co.name === 'Container') && co)
    const JsonArrayType = curObjTypes.find(co => (co.name === 'JsonArray') && co)
    const entityType = curObjTypes.find(co => (co.name === 'EntityType') && co)
    const propertiesType = curObjTypes.find(co => (co.name === 'Properties') && co)
    const propertyType = curObjTypes.find(co => (co.name === 'Property') && co)
    const hasPartType = curRelTypes.find(co => (co.name === 'hasPart') && co)
    const hasMemberType = curRelTypes.find(co => (co.name === 'hasMember') && co)
    const containsType = curRelTypes.find(co => (co.name === 'contains') && co)
    const hasType = curRelTypes.find(co => (co.name === 'has') && co)
    // console.log('38', hasPartType);
    
    // console.log('32 ', JsonObjectType.id, hasPartType.id, hasMemberType.id, hasType.id);
    let objecttypeRef = JsonObjectType?.id // default partof relship in JSON structure
    let reltypeRef = hasPartType?.id // default partof relship in JSON structure
    let reltypeName = hasPartType?.name // default partof relship in JSON structure

    let relshipKind = 'Association' 
    
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
        let topLevelObjectId, entityName
        let reltRef, relDescription, relTitle
        let fromobjectId, fromobjectName, toobjectId, toobjectName
        let topId, topTitle, topDescription, topType, topTypeId 
        let propertyId, propertyName

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

                    if  (osduId.includes("|definitions")) { // definitions contain the osdu Json structure, so we strip off all above definitions
                        const [, ...rest] = newIdArray
                        newosduId = rest.join('|')
                    } else {
                        newosduId = osduId
                    } // split and slice it, pick last element 
                    // if  (osduId.includes("|definitions|")) osduId = osduId.split('|').slice(-1)[0] // split and slice it, pick last element 
                    // console.log('60 :', newosduId);
                    
                    const oKey = newosduId // newosduId is the key for the object in the JSON-file if it has definitions key
                  
                    const gggparentKey = oKey.split('|').slice(0, -4).join('|') // parent path ; split and slice it, pick all exept last element and rejoin
                    const gggparentName = oKey.split('|').slice(-5)[0] // 
                    const ggparentKey = oKey.split('|').slice(0, -3).join('|') // parent path ; split and slice it, pick all exept last element and rejoin
                    const ggparentName = oKey.split('|').slice(-4)[0] // parentName ; split and slice it, pick 4th last element 
                    const gparentKey = oKey.split('|').slice(0, -2).join('|') // parent path ; split and slice it, pick all exept last element and rejoin
                    const gparentName = oKey.split('|').slice(-3)[0] // parentName ; split and slice it, pick 3nth last element 
                    const parentKey = oKey.split('|').slice(0, -1).join('|') // parent path ; split and slice it, pick all exept last element and rejoin
                    let parentName = oKey.split('|').slice(-2)[0] // parentName ; split and slice it, pick 2nd element 
                    const oName = oKey.split('|').slice(-1)[0] // objectName ; split and slice it, pick last element 

                    if (debug) console.log('123 \n ',
                        'ggg',gggparentKey ,
                        gggparentName,'\n',
                        'gg',ggparentKey,
                        ggparentName,'\n',
                        'g',gparentKey,
                        gparentName,'\n',
                        'p',parentKey,
                        parentName,'\n',
                        oKey,
                        oName,'\n',
                    );
                    
                    const oVal =  allkeys[i][1] // the object
                    // console.log('57 :', '\n cleanPath: ', cleanPath, '\n oKey: ', oKey, '\n parentKey: ', parentKey, '\n parentName: ', parentName, '\n oName : ', oName, '\n oVal: ', oVal, '\n parentId: ', parentId);
 
                    let cNewVal = filterObject(oVal)// we only want attributes (objects are handled in the next iteration)

                    if (oName === 'required')  { // special case for required. a list of properties that is required
                        const attributes  = Object.assign(...Object.entries(obj).map(([k, v]) => (k !== (!isNaN(k))))); 
                        cNewVal = {...attributes, 'propNames': Object.values(oVal).toString()}
                    }
                    if (debug) console.log('144 : oKey', oKey, oName, '\n oVal : ', oVal,'\n cNewVal : ', cNewVal);

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
                                        : (oName === 'properties') ? 'Properties' : 'JsonObject'
                                : (oName === 'properties') ? 'Properties' : 'JsonObject'

                    objecttypeRef = curObjTypes.find(ot => ot.name === objTypeName)?.id // find objecttypeRef for the objecttypeName
                    if (debug) console.log('161 : ', i, modelType, oName, objTypeName, ' - ', objecttypeRef);
                    
                    // objecttypeRef = (parentName === "properties") ? propertyType.id : (oName !== "allOf") ? JsonObjectTypeId : JsonArrayTypeId // if parent is property use property typeRef
                    // console.log('102 : ', parentName, oName, objecttypeRef);
                    
                    let compositeName  = oName // temporary puttin title etc into objname for readability - later replace with a JSON - objecttype for the object

                    reltypeRef = (parentName === 'allOf' || parentName === 'anyOf' || parentName === 'onOf')  ? hasMemberType?.id : hasPartType?.id // temporary set array to hasMember relship
                    if (debug) console.log('169', parentName, reltypeRef.id);
                    
                    // check if the object is already in the phData
                    if (debug) console.log('172 : props', props, 'curModel ', curModel);
                    const existObj = curModel.objects.find( (o) => o.osduId === oKey )
                    if (debug) console.log('174 : ', existObj, oKey, existObj?.id);
                    
                    const oId = (existObj) ? existObj.id : utils.createGuid()
                    tmpArray = [...tmpArray, [oKey, oId] ]
                    if (debug) console.log('178 ', tmpArray);           
                    
                    // ---------------------------------------------------------------------------------------------------------------------------------------
                              
         
                    if (modelType === 'AKM') { // if AKM then just create the top level object with title as name + properties
                        if (i === 0 || oName === 'items')  {
                            if (i === 0) {
                                topId = oId 
                                topTitle = cNewVal.title
                            }
                            // const parentName = parentKey.split('|').slice(-1)[0] // parentName ; split and slice it, pick last element 
                            if (!debug) console.log('190 parentKey', parentKey, 'tmpArray ',tmpArray.find( (o) => (parentKey && o[0] === parentKey) && o));
                            parentId = (i === 0) ? null : (parentKey) ? tmpArray.find( (o) => (parentKey && o[0] === parentKey) && o)[1] : oId // set parentId to be used in the next iteration of  objectet.
                            entityId = oId
                            entityName = (i === 0) ? cNewVal.title : parentName+' '+oName // if topobject use title as name
                            // entityName = (i === 0) ? cNewVal.title : (oName === 'items') ? parentName : oName // if topobject use title as name
                            // console.log('142 i', i, entityName, entityId);
                            reltypeRef = hasMemberType.id 
                            reltypeName = hasMemberType.name
                            relshipKind = 'Association'

                            createObject(oId, entityName, objecttypeRef, oKey, jsonType, cNewVal)

                        } else if (oName === 'properties') {
                            
                            reltypeRef = hasPartType?.id
                            reltypeName = hasPartType?.name 
                            relshipKind = 'Association'            
                          
                            cNewVal = {...cNewVal, viewkind: 'Container'}
                            
                            createObject(oId, oName, objecttypeRef, oKey, jsonType, cNewVal)
                            
                            parentId = (ggparentName === 'items') ? tmpArray.find((o) => (o[0] === ggparentKey) && o)[1] : entityId
                            if (!debug) console.log('220 ', tmpArray.find( (o) => (o[0] === ggparentKey) && o[1]));
                            parentName = (ggparentName === 'items') ? tmpArray.find((o) => (o[0] === ggparentKey) && o)[0] : entityName
                            
                            propertyId = oId
                            propertyName = oName

                            if (!debug) console.log('222 parentId', parentId, ggparentName, gggparentKey) // entityName, objecttypeRef, oKey, jsonType, cNewVal);
                            
                            // compositeName = (entityName) ? entityName : oName

                        } else if (parentName === 'properties' && inclProps) { // if the import includes properties

                            console.log( '230 : ', containsType.name, oName, parentName, parentId, oId);
                            reltypeRef = containsType.id
                            reltypeName = containsType.name      
                            relshipKind = 'Aggregation'       
                            // parentId = propertyId
                            // parentName = propertyName
                            // compositeName = (entityName) ? entityName : oName
                            // entityName = oName
                            createObject(oId, oName, objecttypeRef, oKey, jsonType, cNewVal)
            
                        } else {                           
                            continue;
                        }
                        parentId = (parentName === 'properties') ? propertyId : parentId
                        parentName = (parentName === 'properties') ? propertyName : parentName

                    } else {   // create the json objects 
                      
                        reltypeRef = hasPartType?.id
                        reltypeName = hasPartType?.name     
                        relshipKind = 'Association'
                       
                        createObject(oId, compositeName, objecttypeRef, oKey, jsonType, cNewVal)
                        parentIdArray = tmpArray.find( (o) => (o[0] === parentKey) && o) ;
                        parentId = (parentIdArray) && parentIdArray[1]
                        if (!debug) console.log('249 ', parentIdArray, parentId);
                        
                    }

                    let relId = utils.createGuid()
                    // parentId = (oName === 'properties') ? propertyId : (entityId) ? entityId : (parentId) ? parentIdArray[1] : null  
                    // parentName = (propertyId) ? propertyName: (entityName) ? entityName : parentName 
                    // fromobjectId = (parentId) ? parentId : null
                    fromobjectId = parentId
                    fromobjectName = parentName
                    if (debug) console.log('259 propId',propertyId, 'propName', propertyName, 'parentId ',  parentId, 'parName', parentName, 'entId ', entityId, 'entName', entityName);
                    toobjectId = oId
                    toobjectName = oName
                    if (debug) console.log('301 : name', reltypeName, 'reltypeRef', reltypeRef, 'fromobjectId', fromobjectId, fromobjectName, toobjectId, toobjectName);
                    
                    // (parentName === 'properties' && oName.) ?
                    if (debug) onsole.log('265 relId', relId, 'reltypeName ', reltypeName, 'relRef ', reltypeRef, 'fromId ', fromobjectId, 'fromName ', fromobjectName, 'toId ', toobjectId, 'toName ', toobjectName);
                                
                    (fromobjectId !== toobjectId) && createRel(relId, reltypeName, relDescription="", relTitle="", reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName)

                    if (debug) console.log('311 ',
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

    const createObject = (oId, oName, otypeRef, oKey, jsonType, cNewVal) => {

        const importedObject = {
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

        dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: importedObject } );  

    }

    const createRel = (relId, typeName, description, title, reltypeRef, relKind, fromobjectId, fromobjectName, toobjectId, toobjectName) => {
                            
        const importedRel = (fromobjectId) 
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
                    relshipkind: relKind,
                    relshipviews: undefined,
                    toobjectRef: toobjectId,
                    nameTo: toobjectName,
                    typeRef: reltypeRef,
                }  
            :   {}

            // entityId = oId // remember entity id to be used in the next iteration of property  sub objectet.
 
            if (debug) console.log('345 ', fromobjectId, importedRel );

        (fromobjectId && toobjectId) && dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: importedRel });

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

}

