// @ts-nocheck

const debug = false
import * as utils from '../../akmm/utilities';
import camelCase from 'camelcase';
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
    // const masterDataType = curObjTypes.find(co => (co.name === 'MasterData') && co)
    // const WorkProductType = curObjTypes.find(co => (co.name === 'WorkProduct') && co)
    // const WorkProductComponentType = curObjTypes.find(co => (co.name === 'WorkProductComponent') && co)
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
        let topLevelObjectId, entityName, entityTypePathElement
        let reltRef, relDescription, relTitle
        let fromobjectId, fromobjectName, toobjectId, toobjectName
        let topId, topTitle, topDescription, topType, topTypeId 
        let propertyId, propertyName

        // deepEntries take all object-keys and concatinate them in curKey with a path showing all above levels and put them in a new array
        // example: deepEntries
        //    0: (2) ['Well.1.0.0.json', '846aa642-1ae5-4deb-3cbb-cb7f26615838']
        //    1: (2) ['Well.1.0.0.json|allOf', 'fc76c04d-0379-4301-b7cd-d68d861d47f6']
        //    2: (2) ['Well.1.0.0.json|allOf|0', '20200684-f5d4-460b-0f2e-8f4dcaac0441']
        // the curKey is put in a array "allKeys" with curKey as first and the obect as second. 
        function deepEntries( obj ) {
            'use-strict';
            var allkeys, curKey = '', len = 0, i = -1, entryK;
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
            
            if (debug) console.log( '85 allkeys : ', allkeys);

            // iterate over all objects allKeys is an array with [key, value] where key is the Json-object-path and value is the object
            // the key is the path to the object in the JSON-file and the value is the object itself 
            while (++i !== len)
                if (typeof allkeys[i][1] === 'object' && allkeys[i][1] !== null){ // It is an Json structure key as with an object 
                    curKey = allkeys[i][0]+ '';
                    // childKey = (allkeys[i+1]) ? allkeys[i+1][0]+ '' : '';
                    // gchildKey = (allkeys[i+2]) ? allkeys[i+2][0]+ '' : '';
                    // ggchildKey = (allkeys[i+3]) ? allkeys[i+3][0]+ '' : '';
                    const jsonType = (Array.isArray(allkeys[i][1])) ? 'isArray' : 'isObject';
   
                    Array.prototype.push.apply(
                        allkeys,
                        formatKeys( Object.entries(allkeys[i][1]) )
                    );
                    if (debug) console.log('35 :', i, entryK, len, curKey.slice(0, -1), allkeys[i][1]);

                    // make a unique osduId for each object in the JSON-file by concatinating the path to the object with the name its keys
                    // clean up the key path by removing the " in "key" first
                    const cleanPath = curKey.slice(0, -1).replace(/"/g, '') // clean key path ; remove "" from curkey to get a clean key string with the path as curKey
                    // const cleanChildPath = childKey.slice(0, -1).replace(/"/g, '') // clean key path ; remove "" from curkey to get a clean key string with the path as curKey
                    // const cleanGchildPath = gchildKey.slice(0, -1).replace(/"/g, '') // clean key path ; remove "" from curkey to get a clean key string with the path as curKey

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
                    // const childKey = cleanChildPathKey.split('|').slice(-1)[0] // objectName ; split and slice it, pick last element 
                    // const gchildKey =  cleanGchildPathKey.split('|').slice(-1)[0] // objectName ; split and slice it, pick last element 
                    // const ggchildKey =  cleanGchildPathKey.split('|').slice(-1)[0] // objectName ; split and slice it, pick last element 
                  
                    const gggggparentKey = oKey.split('|').slice(0, -5).join('|') // parent path ; split and slice it, pick all exept last element and rejoin
                    const ggggparentKey = oKey.split('|').slice(0, -5).join('|') // parent path ; split and slice it, pick all exept last element and rejoin
                    const ggggparentName = oKey.split('|').slice(-6)[0] // 
                    const gggparentKey = oKey.split('|').slice(0, -4).join('|') // parent path ; split and slice it, pick all exept last element and rejoin
                    const gggparentName = oKey.split('|').slice(-5)[0] // 
                    const ggparentKey = oKey.split('|').slice(0, -3).join('|') // parent path ; split and slice it, pick all exept last element and rejoin
                    const ggparentName = oKey.split('|').slice(-4)[0] // parentName ; split and slice it, pick 4th last element 
                    const gparentKey = oKey.split('|').slice(0, -2).join('|') // parent path ; split and slice it, pick all exept last element and rejoin
                    const gparentName = oKey.split('|').slice(-3)[0] // parentName ; split and slice it, pick 3nth last element 
                    const parentKey = oKey.split('|').slice(0, -1).join('|') // parent path ; split and slice it, pick all exept last element and rejoin
                    let parentName = oKey.split('|').slice(-2)[0] // parentName ; split and slice it, pick 2nd element 
                    const oName = oKey.split('|').slice(-1)[0] // objectName ; split and slice it, pick last element 
                
                    const oVal =  allkeys[i][1] // the object
                    if (debug) console.log('153 :', '\n cleanPath: ', cleanPath, '\n oKey: ', oKey, '\n oName : ', oName, '\n oVal: ', oVal, '\n parentKey: ', parentKey, '\n parentId: ', parentId, '\n parentName: ', parentName);
 
                    let cNewVal = filterObject(oVal)// we only want attributes (objects are handled in the next iteration)
                    let relshipoName // the name of the relationship object
                    let propColloName // the name of the collection object

                    if (oName === 'required')  { // special case for required. a list of properties that is required
                        const attributes  = Object.assign(...Object.entries(obj).map(([k, v]) => (k !== (!isNaN(k))))); 
                        cNewVal = {...attributes, 'propNames': Object.values(oVal).toString()}
                    }
                    if (debug) console.log('146 : oKey', oKey, oName, '\n oVal : ', oVal,'\n cNewVal : ', cNewVal);

                    // this should be replaced by a list of types that create EtityTypes etc.
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

                    objecttypeRef = curObjTypes.find(ot => ot.name === objTypeName)?.id  || curObjTypes.find(ot => ot.name === 'EntityType')?.id // find objecttypeRef for the objecttypeName
                    
                    if (debug) console.log('161 : ', i, modelType, oName, objTypeName, ' - ', objecttypeRef, oVal['$ref']);

                    // check if the object is already in the phData
                    if (debug) console.log('172 : props', props, 'curModel ', curModel);
                    const existObj = curModel.objects.find( (o) => o.osduId === oKey )
                    if (debug) console.log('174 : ', existObj, oKey, existObj?.id);
                    
                    const oId = (existObj) ? existObj.id : utils.createGuid()
                    tmpArray = [...tmpArray, [oKey, oId] ]
                    if (debug) console.log('178 ', tmpArray);           
                    
                    // ---------------------------------------------------------------------------------------------------------------------------------------        
                    if (modelType === 'AKM') { // if AKM then just create the top level object with title as name + properties
                        console.log('179 ', oKey, oVal);
                        
                        // make switch depending on oName
                        if (i === 0) { // if first object in the path then create the top level object, it has no parent

                            parentId = null 
                            parentName = null 
                            entityId = oId
                            entityName = cNewVal?.title?.replace(/\s+/g, '') // if topobject use title as name
                            // get type from the objects $id attribute and pick the second last element of the path
                            entityTypePathElement = (oVal.$id) ? oVal.$id.split('/').slice(-2)[0] : 'EntityType'
                            // convert to camelCase
                            let objTypeElementName = camelCase(entityTypePathElement, {pascalCase: true}) // convert to pascalCase i.e. master-data -> MasterData
                            
                            objecttypeRef = curObjTypes.find(ot => ot.name === objTypeElementName)?.id || entityType.id
                            if (!debug) console.log('205 ', objTypeElementName, objecttypeRef, cNewVal);

                            createObject(oId, entityName, objecttypeRef, oKey, jsonType, cNewVal) // create the top level object

                            // remember top level object
                            const topId = oId


                        } else if (parentName === 'properties' && inclProps) { // if parent is properties this is propertyobject create if import includes properties
                            console.log('227 ', oKey, oVal);
                            
                            // if oVal.type is an array then create a RelshipType objectype
                            if (oVal.type === 'string' || oVal.type === 'number' || oVal.type === 'integer' || oVal.type === 'boolean') { 
                                if (oName.includes('ID')) { // if type is string and name contains ID then it is a relship using the ID as key
                                    objecttypeRef = curObjTypes.find(ot => ot.name === 'PropLink')?.id   
                                    relshipoName = 'has'+oName.replace('ID', '')
                                    cNewVal.linkID = oName
                                    cNewVal.title = oName
                                } else {
                                    objecttypeRef = curObjTypes.find(ot => ot.name === 'Property')?.id
                                }                          
                            } else if (oVal.type === 'array') { // if type is array then create a collection of objects
                                if (oVal.items) {
                                    if (oVal.items.$ref) { // if items is an object then it is a relship using the ID as key
                                        objecttypeRef = curObjTypes.find(ot => ot.name === 'PropLink')?.id
                                        relshipoName = 'has'+oVal.items.$ref.split('/').slice(-2)[0]
                                        cNewVal.linkID = oVal.items.$ref
                                        cNewVal.title = oVal.items.$ref                                  
                                    } else if (oVal.items.allOf) {     //if allOf then its the definition of a relship to an array of objects
                                        if (oVal.items.allOf[1].$ref) { // the object inherits from a ref object (the ref)
                                            objecttypeRef = curObjTypes.find(ot => ot.name === 'PropLink')?.id

                                            // continue; // skip this object for now
                                        } else if (oVal.items.allOf[0].type === 'object') { // this is the object in the array
                                            objecttypeRef = curObjTypes.find(ot => ot.name === 'PropCollection')?.id
                                            propColloName = ggparentName
                                            oId = ggparentKey
                                            // propColloName = Object.keys(oVal.items.allOf[0].properties)[0].replace('ID', '')
                                            cNewVal.linkID = Object.keys(oVal.items.allOf[0].properties)[0]
                                            cNewVal.title = Object.keys(oVal.items.allOf[0].properties)[0]
                                        }
                                    }  
                                }
                            } else if (!oVal.type && oVal['$ref']) { // if no type 
                                console.log('243 ', oVal);
                                
        
                                objecttypeRef = curObjTypes.find(ot => ot.name === 'PropLink')?.id
                            } else if (oVal['x-osdu-indexing']) { // if type is x-osdu-indexing then it is a indexing object
                                // objecttypeRef = curObjTypes.find(ot => ot.name === 'EntityType')?.id
                                continue;
 
                            } else if (gggggparentKey === 'properties') { // if parent of top is also properties this is propertyobject create if import includes properties
                                objecttypeRef = curObjTypes.find(ot => ot.name === 'EntityType')?.id
                            } else {
                                objecttypeRef = curObjTypes.find(ot => ot.name === 'PropLink')?.id
                            }
                            
                            createObject(oId, (propColloName || relshipoName || oName), objecttypeRef, oKey, jsonType, cNewVal) // create the property object
                            
                            if (!debug) console.log('220 ', tmpArray.find( (o) => (o[0] === gparentKey) && o[1]));

                            reltypeRef = containsType.id
                            reltypeName = containsType.name      
                            relshipKind = 'Association'   
                            

                            console.log('222 ',  gggparentName, 'oKey', oKey);

                            if (gggparentName === 'items') {  // if parent is items then create a relship between the parent of the item and the property  
                                // if parent of this item is also properties then use this property as the parent 
                                if (parentId === gggggparentKey) {     // if parentId =         
                                    parentId = tmpArray.find((o) => (o[0] === ggggparentKey) && o)[1] 
                                    parentName = tmpArray.find((o) => (o[0] === ggggparentKey) && o)[0].split('|').slice(3)[0] 
                                // if parent of this item is also properties then use this property as the parent 
                                } else if (parentId === ggggparentKey) {     // if parentId =         
                                    parentId = tmpArray.find((o) => (o[0] === ggggparentKey) && o)[1] 
                                    parentName = tmpArray.find((o) => (o[0] === ggggparentKey) && o)[0].split('|').slice(3)[0] 
                                } else if (parentId === gggparentKey) {
                                    console.log('257 parentId === gggparentKey',  parentId);                        
                                    parentId = tmpArray.find((o) => (o[0] === gggparentKey) && o)[1]
                                    parentName = tmpArray.find((o) => (o[0] === gggparentKey) && o)[0].split('|').slice(3)[0] 
                                } else if (parentId = gparentKey) {                                  
                                    parentId = tmpArray.find((o) => (o[0] === gparentKey) && o)[1]
                                    parentName = tmpArray.find((o) => (o[0] === gparentKey) && o)[0].split('|').slice(3)[0]
                                // } else {
                                //     parentId = tmpArray.find((o) => (o[0] === parentKey) && o)[1]
                                //     parentName = tmpArray.find((o) => (o[0] === parentKey) && o)[0].split('|').slice(3)[0]
                                }
                            
                            } else if (gparentKey === topName) { // most AbstractObjects has properties on the top level object
                                parentId = tmpArray.find((o) => (o[0] === gparentKey) && o)[1]
                                parentName = tmpArray.find((o) => (o[0] === gparentKey) && o)[0].split('|').slice(3)[0] 
                            } else if (gggparentKey){
                                parentId = tmpArray.find((o) => (o[0] === gggparentKey) && o)[1]
                                parentName = tmpArray.find((o) => (o[0] === gggparentKey) && o)[0].split('|').slice(3)[0]
                            }

                            if (!debug) console.log( '232 :  oVal, oId, oName, parentId, parentName', oVal, oId, oName, parentId, parentName);   

                        } else if (oVal['$ref']) {   
                            
                            entityId = oId
                            const typeRest = oVal['$ref'].split('/').slice(-1)[0]
                            console.log('280 ', typeRest);
                            
                            cNewVal.title = (typeRest) && typeRest.split('.')[0] 
                            entityName = 'Is'+cNewVal.title
                            // entityName = oVal['$ref'].split('/').slice(-1)  || 'Is' // 
                            // entityName = (i === 0) ? cNewVal.title : (oName === 'items') ? parentName : oName // if topobject use title as name
                            console.log('142 i', i, oName, entityName, entityId);
                            if (debug) console.log('262: ', oId, oName, entityName, entityId, parentId, parentName);

                            objecttypeRef = curObjTypes.find(ot => ot.name === objTypeName)?.id  || curObjTypes.find(ot => ot.name === 'PropLink')?.id // find objecttypeRef for the objecttypeName


                            reltypeRef = hasType?.id 
                            reltypeName = hasType?.name
                            relshipKind = 'Association'

                            parentId = (gparentKey) && tmpArray.find((o) => (o[0] === gparentKey) && o)[1] 
                            parentName = (gparentKey) && tmpArray.find((o) => (o[0] === gparentKey) && o)[0].split('|').slice(-1) 
                            // find last element of the path
                                                      
                            if (debug) console.log( '232 : ', oVal, oId, oName, parentId, parentName);        
                            
                            createObject(oId, entityName, objecttypeRef, oKey, jsonType, cNewVal) // create the items object    



                        } else {             
                            switch (oName) {
                                case 'allOf': 
                                    continue;
                                case 'anyOf':
                                    continue;
                                case 'oneOf':
                                    continue;
                                case 'properties':
                                    continue;
                                case 'required':                           
                                    continue;
                                // case '$ref':                           
                                //     continue;
                                case 'x-osdu-indexing':                           
                                    continue;
                                case 'items':
                                    continue;
                                case 'itemss':
                                    
                                    // const parentName = parentKey.split('|').slice(-1)[0] // parentName ; split and slice it, pick last element 

                                    
                                    entityId = oId
                                    entityName = oName+' ('+parentName+')' // 
                                    // entityName = (i === 0) ? cNewVal.title : (oName === 'items') ? parentName : oName // if topobject use title as name
                                    // console.log('142 i', i, entityName, entityId);
                                    if (debug) console.log('281 : ', oName, entityName, entityId, parentId, parentName);
                                    
                                    reltypeRef = hasType?.id 
                                    reltypeName = hasType?.name
                                    relshipKind = 'Association'

                                    parentId =  (parentKey) ? tmpArray.find( (o) => (parentKey && o[0] === parentKey) && o)[1] : oId // set parentId to be used in the next iteration of object.
                                    parentName = (parentKey) ? tmpArray.find( (o) => (parentKey && o[0] === parentKey) && o)[0].split('|').slice(-1)[0]  : oName // set parentName by slice parent from the parentKey 
                                    
                                    createObject(oId, entityName, objecttypeRef, oKey, jsonType, cNewVal) // create the items object     
                                    break;    
                                default:
                                    // const parentName = parentKey.split('|').slice(-1)[0] // parentName ; split and slice it, pick last element 

                                    
                                    entityId = oId
                                    entityName = oName // 
                                    // entityName = (i === 0) ? cNewVal.title : (oName === 'items') ? parentName : oName // if topobject use title as name
                                    // console.log('142 i', i, entityName, entityId);
                                    if (debug) console.log('281 : ', oName, entityName, entityId, parentId, parentName);
                                    
                                    reltypeRef = hasType?.id 
                                    reltypeName = hasType?.name
                                    relshipKind = 'Association'

                                    parentId =  (parentKey) ? tmpArray.find( (o) => (parentKey && o[0] === parentKey) && o)[1] : oId // set parentId to be used in the next iteration of object.
                                    parentName = (parentKey) ? tmpArray.find( (o) => (parentKey && o[0] === parentKey) && o)[0].split('|').slice(-1)[0]  : oName // set parentName by slice parent from the parentKey 
                                    
                                    createObject(oId, entityName, objecttypeRef, oKey, jsonType, cNewVal) // create the items object  

                                    if (debug) console.log('285 : ', oName, oVal);
                            }          
                        }

                    } else {   // create the json objects 
                    
                        reltypeRef = hasPartType?.id
                        reltypeName = hasPartType?.name     
                        relshipKind = 'Association'
                    
                        createObject(oId, oName, objecttypeRef, oKey, jsonType, cNewVal)
                        parentIdArray = tmpArray.find( (o) => (o[0] === parentKey) && o) ;
                        parentId = (parentIdArray) && parentIdArray[1]
                        if (debug) console.log('249 ', parentIdArray, parentId);
                        
                    }

                    let relId = utils.createGuid()
                    // parentId = (oName === 'properties') ? propertyId : (entityId) ? entityId : (parentId) ? parentIdArray[1] : null  
                    // parentName = (propertyId) ? propertyName: (entityName) ? entityName : parentName 
                    // fromobjectId = (parentId) ? parentId : null
                    fromobjectId = parentId
                    fromobjectName = parentName
                    if (debug) console.log('259 parentId ',  parentId, 'parName', parentName, 'entId ', entityId, 'entName', entityName, 'tmpArray ', tmpArray);
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

        const importedObject = (modelType === 'AKM') // dont include json attributes
            ?   {
                    id: oId,
                    name: oName,
                   // typeName: type,
                    typeRef: otypeRef,
                    abstract: false,
                    markedAsDeleted: false,
                    modified: true,
                    // osduId: oKey,
                    // jsonType: jsonType,
                    // jsonKey: oName,
                    ...cNewVal // want only attributes 
                }
            :   {
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

        if (debug) console.log('368', importedObject);       

        dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: importedObject } );  
    }

    const createRel = (relId, typeName, description, title, reltypeRef, relKind, fromobjectId, fromobjectName, toobjectId, toobjectName) => {
                            
        const importedRel = (fromobjectId) 
            ?   {
                    id: relId,
                    name: typeName,
                    title: title.replace(/\s+/g, ''),
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

