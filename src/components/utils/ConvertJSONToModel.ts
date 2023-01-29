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
    
    // const containerType = curObjTypes.find(co => (co.name === 'Container') && co)
    // const JsonArrayType = curObjTypes.find(co => (co.name === 'JsonArray') && co)
    const entityType = curObjTypes.find(co => (co.name === 'EntityType') && co)
    // const masterDataType = curObjTypes.find(co => (co.name === 'MasterData') && co)
    // const WorkProductType = curObjTypes.find(co => (co.name === 'WorkProduct') && co)
    // const WorkProductComponentType = curObjTypes.find(co => (co.name === 'WorkProductComponent') && co)
    // const propertiesType = curObjTypes.find(co => (co.name === 'Properties') && co)
    // const propertyType = curObjTypes.find(co => (co.name === 'Property') && co)
    const hasPartType = curRelTypes.find(co => (co.name === 'hasPart') && co)
    // const hasMemberType = curRelTypes.find(co => (co.name === 'hasMember') && co)
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
        // let oldParentKey = null
        let prevId = null
        let mainArray = []
        let entityId = null
        let parentIdArray = []
        let topLevelObjectId, entityName, entityTypePathElement
        let reltRef, relDescription, relTitle
        let fromobjectId, fromobjectName, toobjectId, toobjectName
        let topId, topTitle, topDescription, topType, topTypeId 
        let propertyId, propertyName

        // deepEntries take all object-keys and concatinate them in curKey as a path showing all above levels and put them in a new array
        // example: deepEntries
        //    0: (2) ['846aa642-1ae5-4deb-3cbb-cb7f26615838','Well.1.0.0.json',{$id: 'https://schema.osdu.opengroup.org/json/master-data/Well.1.0.0.json', $schema: 'http://json-schema.org/draft-07/schema#', title: 'Well', description: 'The origin of a set of wellbores.', type: 'object', …}
        //    1: (2) ['fc76c04d-0379-4301-b7cd-d68d861d47f6','Well.1.0.0.json|allOf',  .....]
        //    2: (2) ['20200684-f5d4-460b-0f2e-8f4dcaac0441', 'Well.1.0.0.json|allOf|0',  .......]

        // the curKey is put in a array "allKeys" with curKey as first and the object id as second,and the content i.e. an object as third. 
        function deepEntries( obj ) { // ToDo: this should be a separate function returning an array of allKeys.


            'use-strict';
            var allkeys, curKey = '', len = 0, i = -1, entryK;
            if (debug) console.log('75 deepEntries', obj);
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
            while (++i !== len) // iterate over all objects ToDo: this should be a separate function returning an mainArray including the i.
                if (typeof allkeys[i][1] === 'object' && allkeys[i][1] !== null){ // It is an Json structure key as with an object 
                    console.log('-----------------------------------------------------------------------')
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


                  // define the anscesters of the object in the JSON-file by splitting the path and i.e. get the parentKey (name)
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
 
                    let cNewVal = filterObject(oVal)// we only want attributes in cNewVal (objects are handled in the next iteration)
                    let relshipoName // the name of the relationship object
                    let propColloName // the name of the collection object
                    let entityItemId // the id of the entity item
                    let entityItemName // the name of the entity item
                    let parId, parName

                    if (oName === 'required')  { // special case for required. a list of properties that is required
                        const attributes  = Object.assign(...Object.entries(obj).map(([k, v]) => (k !== (!isNaN(k))))); 
                        cNewVal = {...attributes, 'propNames': Object.values(oVal).toString()}
                    }

                    if (debug) console.log('153 : oKey', oKey, oName, '\n oVal : ', oVal,'\n cNewVal : ', cNewVal);

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
                    
                    if (debug) console.log('170 : ', i, modelType, oName, objTypeName, ' - ', objecttypeRef, oVal['$ref']);

                    // check if the object is already in the phData
                    if (debug) console.log('173 : props', props, 'curModel ', curModel);
                    const existObj = curModel.objects.find(a => a.osduId === oKey )
                    if (debug) console.log('175 : ', curModel.objects, existObj, oKey, existObj?.id);
                    
                    const oId = (existObj) ? existObj.id : utils.createGuid()
                    
                    mainArray = [...mainArray, [oId, oKey, oVal] ] // we add the oId to the oKey and oVal in the mainArray so we can search for the id by oKey (the total path id)
                    if (debug) console.log('186 ', oId, oKey, oVal);           
                    
                    // ---------------------------------------------------------------------------------------------------------------------------------------        
                    if (modelType === 'AKM') { // if AKM then just create the top level object with title as name + properties
                        
                        if (debug) console.log('191 ', gggparentKey, ggparentKey, gparentKey, parentKey, 'oKey', oKey, 'oVal', oVal);
                        
                        if (i === 0) { // if first object in the path then create the top level object, it has no parent
                            if (debug) console.log('----- i = 0')
                            parId = null 
                            parName = null 
                            entityId = oId
                            entityName = cNewVal?.title?.replace(/\s+/g, '') // if topobject use title as name
                            // get type from the objects $id attribute and pick the second last element of the path
                            entityTypePathElement = (oVal.$id) ? oVal.$id.split('/').slice(-2)[0] : 'EntityType' // filter out the entityType from the file path i.e master-data 
                            let objTypeElementName = camelCase(entityTypePathElement, {pascalCase: true}) // convert to pascalCase i.e. master-data -> MasterData
                            
                            objecttypeRef = curObjTypes.find(ot => ot.name === objTypeElementName)?.id || entityType.id
                            if (debug) console.log('197 ', objTypeElementName, objecttypeRef, cNewVal);

                            createObject(oId, entityName, objecttypeRef, oKey, jsonType, cNewVal) // create the top level object

                            // remember top level object
                            topId = oId


                        } else if (parentName === 'properties' && inclProps) { // if parent is properties this is propertyobject create if import includes properties
                            if (debug) console.log('----- parentName = properties')
                            if (debug) console.log('227 ', oKey, oVal);
                            
                            // if oVal.type is an array then create a RelshipType objectype
                            if (oVal.type === 'string' || oVal.type === 'number' || oVal.type === 'integer' || oVal.type === 'boolean') { // this is a normal property
                                if (debug) console.log('----- oval.type = string, number, integer, boolean')
                                if (oName.includes('ID')) { // if type is string and name contains ID then it is a relship using the ID as key
                                    
                                    objecttypeRef = curObjTypes.find(ot => ot.name === 'PropLink')?.id   
                                    relshipoName = 'has'+oName.replace('ID', '')
                                    cNewVal.linkID = oName
                                    cNewVal.title = oName
                                } else {
                                    objecttypeRef = curObjTypes.find(ot => ot.name === 'Property')?.id
                                }                          
                            } else if (oVal.type === 'array') { // if type is array then create a collection of objects
                                if (debug) console.log('----- oVal.type = array')
                                const arrayName = oName
                                const arrayId = mainArray.find(a => (a[1] === oKey) && a[0]) // get the id of the array
                                objecttypeRef = curObjTypes.find(ot => ot.name === 'PropCollection')?.id
                            } else if (!oVal.type && oVal['$ref']) { // if no type 
                                if (debug) console.log('----- oVal.type = $ref')
                                if (debug) console.log('243 ', oVal);      
                                objecttypeRef = curObjTypes.find(ot => ot.name === 'PropLink')?.id
                            } else if (oVal['x-osdu-indexing']) { // if type is x-osdu-indexing then it is a indexing object
                                if (debug) console.log('----- oVal[x-osdu-indexing]')
                                // objecttypeRef = curObjTypes.find(ot => ot.name === 'EntityType')?.id
                                continue;
 
                            // } else if (gggggparentKey === 'properties') { // if gggggparent is properties this is propertyobject create if import includes properties
                            //     objecttypeRef = curObjTypes.find(ot => ot.name === 'EntityType')?.id
                            } else if (gparentName === 'items' || parentName === 'items') { // if parent is items its handled as an array
                                if (debug) console.log('----- gparentName = items or parentName = items')
                                continue;
                            } else {
                                if (debug) console.log('----- else')
                                objecttypeRef = curObjTypes.find(ot => ot.name === 'PropLink')?.id
                            }
                            
                            createObject(oId, (relshipoName || oName), objecttypeRef, oKey, jsonType, cNewVal) // create the property object
                            
                            if (debug) console.log('239 ', mainArray.find(a => (a[1] === oKey) && a[0]), oKey, oName, objecttypeRef, cNewVal);

                            reltypeRef = hasType.id
                            reltypeName = hasType.name      
                            relshipKind = 'Association'   
                                                     
                            
                            console.log('248 ', parentName, gparentName, ggparentName, gggparentName, parentId);''

                            if (debug) console.log( '232 :  oVal, oId, oName, parentId, parentName \n', oVal, oId, oName, parentId, parentName);   

                            parId = (gggparentKey) ? mainArray.find(a => (a[1] === gggparentKey))[0] : topId
                            parName = (gggparentKey) ? mainArray.find(a => (a[1] === gggparentKey))[1] : topName

                        } else if (oVal['$ref']) {   
                            if (debug) console.log('----- oVal[$ref]')
                            entityId = oId
                            const typeRest = oVal['$ref'].split('/').slice(-1)[0]
                            if (debug) console.log('264 ', typeRest);
                            
                            cNewVal.title = (typeRest) && typeRest.split('.')[0] 
                            entityName = 'Is'+cNewVal.title
                            // entityName = oVal['$ref'].split('/').slice(-1)  || 'Is' // 
                            // entityName = (i === 0) ? cNewVal.title : (oName === 'items') ? parentName : oName // if topobject use title as name
                            if (debug) console.log('270 i', i, oName, entityName, entityId, entityItemId, entityItemName);
                            if (debug) console.log('271: ', oId, oName, entityName, entityId, parId, parName);
                                 
                            objecttypeRef = curObjTypes.find(ot => ot.name === objTypeName)?.id  || curObjTypes.find(ot => ot.name === 'PropLink')?.id // find objecttypeRef for the objecttypeName
                            
                            createObject(oId, entityName, objecttypeRef, oKey, jsonType, cNewVal) // create the items object    
                            
                            // set the parentId and parentName for this object
                            
                            reltypeRef = hasType?.id 
                            reltypeName = hasType?.name
                            relshipKind = 'Association'
                            console.log('286 ', gparentKey, mainArray.find(a => (a[1] === gparentKey))[0], mainArray.find(a => (a[1] === gparentKey))[1]);
                            
                            if (gparentName === 'items') { // like verticalMeasurements in Well
                                parId   = mainArray.find(a => (a[1] === gparentKey))[0] 
                                parName = mainArray.find(a => (a[1] === gparentKey))[1] 
                                if (debug) console.log('298 :  ', oId, oName, parId, parName);          
                            } else if (parentName === 'items') { // like ?????
                                parId   = mainArray.find(a => (a[1] === parentKey))[0]
                                parName = mainArray.find(a => (a[1] === parentKey))[1]
                                if (debug) console.log('301 :  ', oId, oName, parId, parName);          
                            } else if (oName === 'items') { // like DrillingReasons in wellbore
                                parId   = mainArray.find(a => (a[1] === parentKey))[0]
                                parName = mainArray.find(a => (a[1] === parentKey))[1]
                                if (debug) console.log('305 :  ', oId, oName, parId, parName);          
                            } else {
                                parId = topId
                                parName = topName
                                if (debug) console.log('305 :  ', oId, oName, parId, parName);          
                            }
                            if (debug) console.log('307 :  ', oId, oName, parId, parName, gparentName);          

                        } else if (oVal.type === 'object') {
                            continue;
                            // if (debug) console.log('----- oVal.type = object')
                            // if (debug) console.log('290', oVal, oId, oName, 'i', i);
                            // // find parent object
                            // if (mainArray.find(a => (a[1] === gparentKey))[0] === topId) continue;  // if parent is top object then skip because it is handled before

                            // entityId = oId

                            // if (oVal.title) {
                            //     entityItemId = oId // remember the id of the Item object
                            //     entityName = oVal?.title 
                            //     // remove 'ID' and spaces from the title 
                            //     entityName = entityName.replace(/\s+/g, '').replace('ID', '')  
                            //     entityItemName = entityName                  
                            //     if (debug) console.log('303 ', entityItemId, entityName, entityItemName);            

                            // } else {
                                // entityName is ggparentName, remove if the last character is a 's'
                                // entityName = (ggparentName) && (ggparentName.slice(-1) === 's') ? ggparentName.slice(0, -1) : ggparentName
                            // }

                            // objecttypeRef = curObjTypes.find(ot => ot.name === objTypeName)?.id  || curObjTypes.find(ot => ot.name === 'EntityType')?.id // find objecttypeRef for the objecttypeName
                            
                            // if (entityName !== parentName) createObject(entityId, entityName, objecttypeRef, oKey, jsonType, cNewVal) // create the object   

                            // if (debug) console.log('308', entityId, entityName, objecttypeRef, oKey, jsonType, cNewVal, oVal, parentName);

                            // reltypeRef = hasType?.id
                            // reltypeName = hasType?.name
                            // relshipKind = 'Association'
                            
                            // if (gparentName === 'items') {
                            //     // parentId = mainArray.find(a => (a[1] === ggparentKey))[0]
                            //     // parentName = mainArray.find(a => (a[1] === ggparentKey))[1]
                            //     parentId = entityItemId
                            //     parentName = entityItemName
                            //     if (debug) console.log( '316 :  oVal, oId, oName, parentId, parentName, gparentName /n', oVal, oId, oName, parentId, parentName, gparentName, ggparentName); 
                            // } else {
                            //     parentId = topId
                            //     parentName = topName
                            // }
                            // if (debug) console.log('321', gparentName, parentId, parentName);             
                               
                        } else {             
                            switch (oName) {  // skip these jsonTypes
                                case 'allOf':  
                                case 'anyOf':
                                case 'oneOf':
                                case 'properties':
                                case 'required':                           
                                // case '$ref':                           
                                //     continue;
                                case 'x-osdu-indexing':                           
                                // all of the above should be skipped
                                
                                break;
                                
                                case 'items':  // find grandchildren object with ID in the name
                                    if (debug) console.log('----- oName = items -------------------------------------------------------------------------------------------------')
                                    if (debug) console.log('345', oVal, oId, oName, objTypeName, 'i', i);
                                    // find key of child object 
                                    console.log('348 ', (oVal.allOf) && Object.keys(oVal?.allOf[0]?.properties))
                                    const gchildKeyName = (oVal.allOf) ? Object.keys(oVal?.allOf[0]?.properties).find(k => k.includes('ID')).replace('ID', '') : null

                                    // const gchildTitle = oVal.allOf[0]?.properties?.title?.includes('ID') || null
                                    if (gchildKeyName) {
                                        entityId = oId
                                        entityName = gchildKeyName


                                        objecttypeRef =  (gchildKeyName) && curObjTypes.find(ot => ot.name === objTypeName)?.id || curObjTypes.find(ot => ot.name === 'PropLink')?.id // find objecttypeRef for the objecttypeName
                                        // objecttypeRef = (gchildKeyName === '$ref') ? curObjTypes.find(ot => ot.name === 'PropLink')?.id  : curObjTypes.find(ot => ot.name === objTypeName)?.id // find objecttypeRef for the objecttypeName

                                        reltypeRef = containsType?.id 
                                        reltypeName = containsType?.name
                                        relshipKind = 'Association'

                                        parId =   (parentKey) && mainArray.find(a => (a[1] === parentKey))[0] || topId
                                        parName =  (parentKey) && mainArray.find(a => (a[1] === parentKey))[1] || topName
                                    }
                                    // find last element of the path
                                                            
                                    if (debug) console.log( '285 :  ', oVal, oId, oName, parId, parName,);       
                                    
                                    createObject(oId, entityName, objecttypeRef, oKey, jsonType, cNewVal) // create the items object    


                                
                                default:
                                    break;
                            }          
                        }
                        // mainArray:   ['846aa642-1ae5-4deb-3cbb-cb7f26615838','Well.1.0.0.json',{$id: 'https://schema.osdu.ope....]
                        // parentId = (gggparentKey) && mainArray.find(a => (a[1] === gggparentKey))[0] 
                        // parentName = (gggparentKey) && mainArray.find(a => (a[1] === gggparentKey))[1] 
                        if (debug) console.log('390', parId, parName);

                    } else {   // create the json objects 
                    
                        reltypeRef = hasPartType?.id
                        reltypeName = hasPartType?.name     
                        relshipKind = 'Association'
                    
                        createObject(oId, oName, objecttypeRef, oKey, jsonType, cNewVal)
                        parentIdArray = mainArray.find(a => (a[1] === parentKey) && a[0]) ;
                        parentId = (parentIdArray) && parentIdArray[1]
                        if (debug) console.log('249 ', parentIdArray, parentId);
                        
                    }

                    // create the relationships

                    let relId = utils.createGuid()
                    // parentId = (oName === 'properties') ? propertyId : (entityId) ? entityId : (parentId) ? parentIdArray[1] : null  
                    // parentName = (propertyId) ? propertyName: (entityName) ? entityName : parentName 
                    // fromobjectId = (parentId) ? parentId : null
                    fromobjectId = parId
                    fromobjectName = parName
                    if (debug) console.log('402 parId ',  parId, 'parName', parName, 'entId ', entityId, 'entName', entityName, 'mainArray ', mainArray);
                    toobjectId = oId
                    toobjectName = oName
                    if (debug) console.log('405 : name', reltypeName, 'reltypeRef', reltypeRef, 'fromobject', fromobjectId, fromobjectName, 'toobject',toobjectId, toobjectName);
                    
                    // (parentName === 'properties' && oName.) ?
                    if (debug) onsole.log('408 relId', relId, 'reltypeName ', reltypeName, 'relRef ', reltypeRef, 'fromId ', fromobjectId, 'fromName ', fromobjectName, 'toId ', toobjectId, 'toName ', toobjectName);
                                
                    (fromobjectId !== toobjectId) && createRel(relId, reltypeName, relDescription="", relTitle="", reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName)        

                   prevId = oId     
                //    oldParentKey = parentKey // remember for next object
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

        const existObj = curModel.objects.find(o => o.id === oId) || null
        console.log('existObj', oName, existObj)
        if (!existObj) {
            const importedObject = (modelType === 'AKM') // dont include json attributes
                ?   {
                        id: oId,
                        name: oName,
                    // typeName: type,
                        typeRef: otypeRef,
                        abstract: false,
                        markedAsDeleted: false,
                        modified: true,
                        osduId: oKey,
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

            if (debug) console.log('469 Create object: ', importedObject.name);             
            dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: importedObject } );  
        }
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
 
            if (debug) console.log('492 Create relship', fromobjectName, importedRel.name, toobjectName );

        (fromobjectId && toobjectId) && dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: importedRel });

    }

    // filter to get only attributes (objects removed)
    function filterObject(obj) {
        let newobj = {}
        for (var i in obj) {
            if (!obj.hasOwnProperty(i)) continue;
            if (typeof obj[i] == 'object') continue;
            let tmpkey = i
            if (i === 'type') tmpkey = 'osduType' // type is a akmm attribute probably not the same as osdu attribute

            newobj = {
                ...newobj,
                [tmpkey]: obj[i]
            }
            // console.log('130', i, obj[i], newobj);
        }
        if (debug) console.log('513 :', obj, newobj);
        
        return newobj;
    }


    function process(key,value) { //called with every property and its value
        // if (key === "id") key = "$id"  // We will use our own uuid so rename if source has id
        // if (key === 'name' && (!value))  key = "contryName"
        const attribute = {[key]:value}
        return attribute
    }

}

