// @ts-nocheck

const debug = false
import * as utils from '../../akmm/utilities';
import camelCase from 'camelcase';
import ObjectTable from '../table/ObjectTable';
import { FaAudioDescription } from 'react-icons/fa';

// read json file and convert OSDU Json format to AKM model
export const ReadConvertJSONFromFileToAkm = async (modelType, inclProps, props, dispatch, jsonFile) => {
    // console.log('11', jsonFile)
// export const ReadConvertJSONFromFileToAkm = async (modelType, inclProps, props, dispatch, e) => {
//     e.preventDefault()
//     const files = e.target.files 
//     console.log('13 ', files, e)
   
//     const reader = new FileReader()

    const curModel = props.phData.metis.models.find(m => m.id === props.phFocus.focusModel.id)
    if (debug) console.log('14 ', props.phFocus.focusModel, curModel, props.phData.metis.models);
    
    const curMetamodel = props.phData.metis.metamodels.find(mm => mm.id === curModel.metamodelRef)
    const curObjTypes = curMetamodel.objecttypes
    const curRelTypes = curMetamodel.relshiptypes

    const JsonObjectType = curObjTypes.find(co => (co.name === 'JsonObject') && co)
    
    const entityType = curObjTypes.find(co => (co.name === 'EntityType') && co)
    const hasPartType = curRelTypes.find(co => (co.name === 'hasPart') && co)
    // const hasMemberType = curRelTypes.find(co => (co.name === 'hasMember') && co)
    const containsType = curRelTypes.find(co => (co.name === 'contains') && co)
    const hasType = curRelTypes.find(co => (co.name === 'has') && co)
    // console.log('38', hasPartType);
    let objecttypeRef = JsonObjectType?.id // default partof relship in JSON structure
    let reltypeRef = hasPartType?.id // default partof relship in JSON structure
    let reltypeName = hasPartType?.name // default partof relship in JSON structure

    let relshipKind = 'Association' 
    
    
    const createObject = (oId, oName, otypeRef, oKey, jsonType='object', cNewVal) => {

        if (!curModel.objects.find(o => o.id === oId)) {
            // if (debug) console.log('38 existObj', oName, existObj)
            // if (!existObj) {
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
                        description: description,
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

            if (debug) console.log('68 Create object: ', importedObject.name);             
            dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: importedObject } );  
            
            return importedObject
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

            if (debug) console.log('100 Create relship', fromobjectName, importedRel.name, toobjectName );

        (fromobjectId && toobjectId) && dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: importedRel });

    }





    // reader.fileName = file.name
    // reader.onload = async (e) =>  { 
    //     const text = (e.target.result)
        // const osduMod = JSON.parse(text) // importert JSON file
        const osduMod = JSON.parse(jsonFile) // importert JSON file
        if (debug) console.log('121 osduMod', osduMod)


        // .-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-
        // hardcoded content add ../abstract/AbstractSystemProperties.json to the file
        // if  $id contains master-data or work-product-component or work-product then add the file to the model
        if (osduMod['$id'].includes('master-data') || osduMod['$id'].includes('work-product-component') || osduMod['$id'].includes('work-product')) {
            // insert abstractSystemProperties into the jsonobject
            const aspObj = JSON.parse(`{ "$ref": "../abstract/AbstractSystemProperties.1.0.0.json" }`)
            console.log('126 ', osduMod, aspObj)
            // insert aspropObj as item number 1 into the allOf array of the jsonobject
            osduMod.allOf?.splice(1, 0, aspObj)
        }


        if (!debug) console.log('32', osduMod, osduMod["$id"], osduMod["x-osdu-schema-source"] );
        // if (osduMod["$id"]) console.log('20',  osduMod["$id"].split('/').slice(-1)[0]  );
        
        const topName = (osduMod["$id"]) ? osduMod["$id"].split('/').slice(-1)[0] : osduMod["x-osdu-schema-source"] 
        const topModel ={[topName]: osduMod} // top object is given topName as key 

        let parentId = null //topModel.id || osduMod["$id"]
        let mainArray = []
        let entityName

        // deepEntries take all object-keys and concatinate them in curKey as a path showing all above levels and put them in a new array
        // example: deepEntries
        //    0: (2) ['846aa642-1ae5-4deb-3cbb-cb7f26615838','Well.1.0.0.json',{$id: 'https://schema.osdu.opengroup.org/json/master-data/Well.1.0.0.json', $schema: 'http://json-schema.org/draft-07/schema#', title: 'Well', description: 'The origin of a set of wellbores.', type: 'object', …}
        //    1: (2) ['fc76c04d-0379-4301-b7cd-d68d861d47f6','Well.1.0.0.json|allOf',  .....]
        //    2: (2) ['20200684-f5d4-460b-0f2e-8f4dcaac0441', 'Well.1.0.0.json|allOf|0',  .......]
        // the curKey is put in a array "allKeys" with curKey as first and the object id as second,and the content i.e. an object as third. 

        function deepEntries( obj ) { // obj is the object to be traversed

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

                    const jsonType = (Array.isArray(allkeys[i][1])) ? 'isArray' : 'isObject';

                    Array.prototype.push.apply(
                        allkeys,
                        formatKeys( Object.entries(allkeys[i][1]) )
                    );
                    if (debug) console.log('35 :', i, entryK, len, curKey.slice(0, -1), allkeys[i][1]);

                    // make a unique osduId for each object in the JSON-file by concatinating the path to the object with the name its keys
                    // clean up the key path by removing the " in "key" first
                    const cleanPath = curKey.slice(0, -1).replace(/"/g, '') // clean key path ; remove "" from curkey to get a clean key string with the path as curKey

                    let osduId =  cleanPath
                    let newosduId
                    let newIdArray = osduId.split('|') // make an array of all keys in the path

                    if  (osduId.includes("|definitions")) { // definitions is in OSDU Generated folder and contain the osdu Json structure, so we strip off all above definitions
                        const [, ...rest] = newIdArray
                        newosduId = rest.join('|')
                    } else {
                        newosduId = osduId
                    } 

                    // split and slice it, pick last element 
                    // if  (osduId.includes("|definitions|")) osduId = osduId.split('|').slice(-1)[0] // split and slice it, pick last element 
                    // console.log('60 :', newosduId);
                    
                    const oKey = newosduId // newosduId is the key for the object in the JSON-file if it has definitions key
                    // const childKey = cleanChildPathKey.split('|').slice(-1)[0] // objectName ; split and slice it, pick last element 
                    // const gchildKey =  cleanGchildPathKey.split('|').slice(-1)[0] // objectName ; split and slice it, pick last element 
                    // const ggchildKey =  cleanGchildPathKey.split('|').slice(-1)[0] // objectName ; split and slice it, pick last element 
    
                    const oVal =  allkeys[i][1] // the object
                    if (debug) console.log('194 :', '\n cleanPath: ', cleanPath, '\n oKey: ', oKey, '\n oName : ', oName, '\n oVal: ', oVal, '\n parentKey: ', parentKey, '\n parentId: ', parentId, '\n parentName: ', parentName);

                    // let cNewVal = filterObject(oVal)// we only want attributes in cNewVal (objects are handled in the next iteration)

                    // check if the object is already in the phData
                    if (debug) console.log('199 : props', props, 'curModel ', curModel);
                    const existObj = curModel.objects.find(a => a.osduId === oKey )
                    if (debug) console.log('201 : ', curModel.objects, existObj, oKey, existObj?.id);
                    
                    const oId = (existObj) ? existObj.id : utils.createGuid()
                    mainArray = [...mainArray, [oId, oKey, oVal] ] // we add the oId to the oKey and oVal in the mainArray so we can search for the id by oKey (the total path id)
                    if (debug) console.log('205 ', oId, oKey, oVal);   
                }
                return mainArray
        }
    
        const osduArray = deepEntries(topModel) // find all the objects in the topModel and down the tree
        if (debug) console.log('201 deepEntries', osduArray);

        // map through the osduArray and create objects and relationships between the objects
        const osduObjects = osduArray.map( (osduObj, index) => {
            const [oId, oKey, oVal] = osduObj
            const oName = oKey?.split('|')?.slice(-1)[0] // objectName ; split and slice it, pick last element
            if (debug) console.log('206 :', oName, index, oId, oKey)//, oVal);
            const cNewVal = filterObject(oVal)// filter away subobjects, we only want attributes in cNewVal (objects are handled in the next iteration)
            const parentName = oKey?.split('|')?.slice(-2,-1)[0] // parentName ; split and slice it, pick second last element
            const jsonType = (Array.isArray(oVal)) ? 'isArray' : 'isObject';




            // first we create the objects ----------------------------------------------------------------------
            if (index === 0) { // the first object is the in the json file (topObj)
                //  Set tobObjName = all before dot
                const topObjName = oName.split('.')[0] // remove the version number from the name
                // get type from the objects $id attribute and pick the second last element of the path which is the folder name
                const entityTypePathElement = (oVal.$id) ? oVal.$id.split('/').slice(-2)[0] : 'EntityType' // filter out the entityType from the file path i.e master-data 
                let objTypeElementName = camelCase(entityTypePathElement, {pascalCase: true}) // convert to pascalCase i.e. master-data -> MasterData
                if (objTypeElementName === 'Abstract') cNewVal.abstract = true // if the object is abstract, set the abstract property to true
                // if (objTypeElementName === 'ReferenceData') cNewVal.abstract = true // if the object is abstract, set the abstract property to true
                // console.log('221 objTypeElementName', objTypeElementName, cNewVal);
                objecttypeRef = curObjTypes.find(ot => ot.name === objTypeElementName)?.id || curObjTypes.find(ot => ot.name === 'EntityType')?.id // find objecttypeRef for the objecttypeName
                createObject(oId, topObjName, objecttypeRef, oKey, jsonType, cNewVal) // create the top object   
                // console.log('215 topObject', oId, oName, objecttypeRef,oKey, jsonType, cNewVal);

            } else if (parentName === 'properties') { // this is property and proplink objectsƒ
        
                if (oVal.type === 'array') { // if the value is an array we create a collection object
                    // oName includes char Set as the last characters of the name
                    if (oName.includes('Set')) { // if the object has a dot in the name, we create a collection object
                        objecttypeRef = curObjTypes.find(ot => ot.name === 'PropLink')?.id
                        const linkId = oName.replace('Set', '') // remove Set from the name
                        const propLinkName = 'has' + oName
                        cNewVal.linkId = linkId
                        createObject(oId, propLinkName, objecttypeRef, oKey, jsonType, cNewVal) // create the collection objects
                        if (debug) console.log('271  array', oId, propLinkName, objecttypeRef, oKey, jsonType, cNewVal);
                        findOwnerandCreateRelationship(osduObj)
                    } else if (oName.includes('ID') ) { // if the object has a dot in the name, we create a collection object
                       if (debug) console.log('275  array', oId, oName, oKey, jsonType, cNewVal);
                        objecttypeRef = curObjTypes.find(ot => ot.name === 'PropLink')?.id
                        let linkId = oName.replace('ID', '') // remove Set from the name
                        if (debug) console.log('277  array', oName, linkId);
                        const propLinkName = 'has' + oName
                        cNewVal.linkId = oName
                        createObject(oId, propLinkName, objecttypeRef, oKey, jsonType, cNewVal) // create the collection objects
                        if (debug) console.log('290  array', oId, propLinkName, objecttypeRef, oKey, jsonType, cNewVal);
                        findOwnerandCreateRelationship(osduObj)
                        // } else if (oVal.type === '$ref') { // if the value is a reference we create a reference object
                        //     objecttypeRef = curObjTypes.find(ot => ot.name === 'PropLink')?.id
                        //     createObject(oId, oName, objecttypeRef, oKey, jsonType, cNewVal) // create the reference objects
                        //  
                    } else {
                        if (debug) console.log('389  array', oId, oName, oKey, jsonType);
                        objecttypeRef = curObjTypes.find(ot => ot.name === 'EntityType')?.id
                        cNewVal.linkId = oName
                        createObject(oId, oName, objecttypeRef, oKey, jsonType, cNewVal) // create the reference objects
                        findOwnerandCreateRelationship(osduObj)
                    }

                } else if (oVal.type === 'string') { // || oVal === 'integer' || oVal === 'number' || oVal === 'boolean' || oVal === 'array' || oVal === 'object') { // if the value is a primitive type                  
                    if (oName.includes('ID')) { // if the name contains ID, we create a relationship between the object and the parent object
                        const propLinkName = 'has'+oName
                        objecttypeRef = curObjTypes.find(ot => ot.name === 'PropLink')?.id
                        cNewVal.linkId = oName.replace('ID', '')
                        // hardcoded transformation of the name
                        // i.e. if o.linkId is = 'Company' then transform to 'Organisation'     
                        if (cNewVal.linkId === 'Company') {cNewVal.linkId = 'Organisation'}
                        if (cNewVal.linkId === 'ServiceCompany') {cNewVal.linkId = 'Organisation'}
                        if (cNewVal.linkId === 'ParentProject') {cNewVal.linkId = 'Project'}
                        if (cNewVal.linkId === 'StationPropertyUnit') {cNewVal.linkId = 'UnitOfMeasure'}
                        if (cNewVal.linkId === 'TrajectoryStationPropertyType') {cNewVal.linkId = 'TrajectoryStationPropertyType'}
                        if (cNewVal.linkId === 'SurveyToolType') {cNewVal.linkId = 'SurveyToolType'}
                        if (cNewVal.linkId === 'GeographicCRS') {cNewVal.linkId = 'CoordinateReferenceSystem'}
                        if (cNewVal.linkId === 'ProjectedCRS') {cNewVal.linkId = 'CoordinateReferenceSystem'}
                        if (cNewVal.linkId === 'Feature') {cNewVal.linkId = 'LocalRockVolumeFeature'}
                        if (cNewVal.linkId === 'ColumnStratigraphicHorizonTop') {cNewVal.linkId = 'HorizonInterpretation'}
                        if (cNewVal.linkId === 'ColumnStratigraphicHorizonBase') {cNewVal.linkId = 'HorizonInterpretation'}
                        if (cNewVal.linkId === 'RockVolumeFeature') {cNewVal.linkId = 'LocalRockVolumeFeature'}
               
                        // cNewVal.title = objName
                        createObject(oId, propLinkName, objecttypeRef, oKey, jsonType, cNewVal) // create the property objects
                        if (debug) console.log('303 ID', oId, propLinkName, objecttypeRef,oKey, jsonType, cNewVal);
                        findOwnerandCreateRelationship(osduObj)
                    } else { // if the name does not contain ID, we create a property object
                        objecttypeRef = curObjTypes.find(ot => ot.name === 'Property')?.id
                        createObject(oId, oName, objecttypeRef, oKey, jsonType, cNewVal) // create the property objects
                        if (debug) console.log('296 not ID ', oId, oName, objecttypeRef,oKey, jsonType, cNewVal);
                        findOwnerandCreateRelationship(osduObj)
                    }
                } else {
                    objecttypeRef = curObjTypes.find(ot => ot.name === 'Property')?.id
                    createObject(oId, oName, objecttypeRef, oKey, jsonType, cNewVal) // create the collection objects
                    if (debug) console.log('315  array', oId, oName, objecttypeRef,oKey, jsonType, cNewVal);
                    findOwnerandCreateRelationship(osduObj)
                }
            } else if (oVal['$ref']) { // this is a reference to another object (abstract)
                const objecttypeRef = curObjTypes.find(ot => ot.name === 'PropLink')?.id
                const typeRest = oVal['$ref'].split('/').slice(-1)[0]
                cNewVal.title = (typeRest) && typeRest.split('.')[0] 
                cNewVal.linkId = (typeRest) && typeRest.split('.')[0] 
                const entityName = 'Is'+cNewVal.title
                createObject(oId, entityName, objecttypeRef, oKey, jsonType, cNewVal) // create the reference objects               
                if (!debug) console.log('330 $ref', oId, entityName, objecttypeRef,oKey, jsonType, cNewVal);  
                findOwnerandCreateRelationship(osduObj)
            } else if (oName === 'items') { // 
                let gchildKeyName, gchildKeyNameId
                if (oVal.allOf) { // 
                    gchildKeyNameId = Object.keys(oVal?.allOf[0]?.properties).find(k => k.includes('ID')) 
                    gchildKeyName = gchildKeyName?.replace('ID', '')
                    objecttypeRef = curObjTypes.find(ot => ot.name === 'PropLink')?.id // find objecttypeRef
                // } else if (parentName.includes('Set')) {           
                //     gchildKeyNameId = parentName
                //     gchildKeyName = gchildKeyNameId.replace('Set', '') 
                //     console.log('296 Set', oName, gchildKeyNameId, gchildKeyName, cNewVal);
                //     objecttypeRef =  curObjTypes.find(ot => ot.name === 'PropLink')?.id // find objecttypeRef
                }

                if (gchildKeyName) {
                    entityName =    'Is'+gchildKeyName
                    cNewVal.title = gchildKeyNameId
                    cNewVal.linkId = gchildKeyNameId
                    // objecttypeRef = (gchildKeyName === '$ref') ? curObjTypes.find(ot => ot.name === 'PropLink')?.id  : curObjTypes.find(ot => ot.name === objTypeName)?.id // find objecttypeRef for the objecttypeName

                    reltypeRef = containsType?.id 
                    reltypeName = containsType?.name
                    relshipKind = 'Association'
                    
                    createObject(oId, entityName, objecttypeRef, oKey, jsonType, cNewVal) // create the reference objects               
                    // console.log('278 $ref', oId, entityName, objecttypeRef,oKey, jsonType, cNewVal);  
                    findOwnerandCreateRelationship(osduObj)
                // } else if (oVal.it) {

                }
            } else { // the rest we dont make objects for
                    if (debug) console.log('350 no obj', oId, oName, objecttypeRef,oKey, jsonType, cNewVal);  
                    // createObject(oId, entityName, objecttypeRef, oKey, jsonType, cNewVal) // create the reference objects  
            }
        })

        // -----------------------------------------------------------------------------------------------------------------
        // crate relationships between objects
        // create function findOwnerandCreateRelationship(oId, oKey)
        function findOwnerandCreateRelationship(osObj) {
            // console.log('359 ', osObj);
            const topObj = mainArray[0]
            const topObjId = topObj[0]
            const topObjKey = topObj[1]
            const topObjName = topObj[1].split('.').slice(-1)[0]
            if (debug) console.log('topObjName', topObjName, topObjKey, topObj);
            // const osduObj = curModel.objects.find(o => o.osduId === topObjKey)


            const [oId, oKey, oVal] = osObj
            const oName = oKey?.split('|')?.slice(-1)[0] // objectName ; split and slice it, pick last element
            const parentName = oKey?.split('|')?.slice(-2,-1)[0] // parentName ; split and slice it, pick second last element
            const gparentName = oKey?.split('|')?.slice(-3,-2)[0] // grandparentName ; split and slice it, pick third last element
            const ggparentName = oKey?.split('|')?.slice(-4,-3)[0] // grandgrandparentName ; split and slice it, pick fourth last element
            const gggparentName = oKey?.split('|')?.slice(-5,-4)[0] // grandgrandgrandparentName ; split and slice it, pick fifth last element
            const ggggparentName = oKey?.split('|')?.slice(-6,-5)[0] // grandgrandgrandgrandparentName ; split and slice it, pick sixth last element
            const gggggparentName = oKey?.split('|')?.slice(-7,-6)[0] // grandgrandgrandgrandgrandparentName ; split and slice it, pick seventh last element
            
            const parentKey = oKey.split('|').slice(0,-1).join('|') // find parent key by splitting the oKey and remove the last element           
            const gparentKey = oKey.split('|').slice(0,-2).join('|') // find grandparent key by splitting the oKey and remove the last two elements            
            const ggparentKey = oKey.split('|').slice(0,-3).join('|') // find greatgrandparent key by splitting the oKey and remove the last three elements           
            const gggparentKey = oKey.split('|').slice(0,-4).join('|') // find greatgreatgrandparent key by splitting the oKey and remove the last four elements
            const ggggparentKey = oKey.split('|').slice(0,-5).join('|') // find greatgreatgreatgrandparent key by splitting the oKey and remove the last five elements
            const gggggparentKey = oKey.split('|').slice(0,-6).join('|') // find greatgreatgreatgreatgrandparent key by splitting the oKey and remove the last six elements

                const relId = utils.createGuid()
                const relDescription = ''
                const relTitle = ''
                reltypeRef = hasType.id
                reltypeName = hasType.name      
                relshipKind = 'Association'   

                if (debug) console.log('390 parentName', gggparentName, ggparentName, gparentName, parentName);

                // console.log('322  ', osduArray.find(o => o[1] === ggparentKey)[2]) //?.type === 'object')
                if (parentName === 'properties') { // if the parent is properties, we have to fine owner and create a relationship between the object and the owner object    
                    // console.log('394 ', parentName, gggparentKey, topObjKey, oKey );
                    if (gparentKey === topObjKey) { // if granparent is the top object, it is the owner
                        const fromobjectId = topObjId
                        const fromobjectName = topObjName
                        const toobjectId = oId
                        const toobjectName = oName
                        if (!debug) console.log('423 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId, oVal);
                        // (fromobjectId !== toobjectId) && 
                        if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName)  

                    } else if (gggparentKey === topObjKey) { // if gggparentKey is the same as topObjKey, we use the topObj as owner
                        // console.log('322', gggparentKey, parentName,  topObjKey );
                        const fromobjectId = topObjId
                        const fromobjectName = topObjName
                        const toobjectId = oId
                        const toobjectName = oName
                        if (debug) console.log('433 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                        // (fromobjectId !== toobjectId) && 
                        if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName) 

                    } else if (gparentName === 'items' || ggparentName === 'properties') { // if the parent is items, we have to find owner 
                        let ownerObj 
                        if (ggparentName === 'properties') { // if the greatgrandparent is properties, we have to fine owner and create a relationship between the object and the owner object}
                            ownerObj = osduArray.find(o => o[1] === parentKey)
                        } else {
                            ownerObj = osduArray.find(o => o[1] === ggparentKey)
                        }
                        if (debug) console.log('421', gparentKey, parentName, topObjKey );               
                        const fromobjectId = ownerObj[0]
                        const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                        const toobjectId = oId
                        const toobjectName = oName  
                        if (debug) console.log('449 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                        if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName) 

                    } else if (gggparentName === 'items') { // if the greatgrandparent is items, we have to fine owner and create a relationship between the object and the owner object
                        const ownerObj = osduArray.find(o => o[1] === ggggparentKey)
                        const fromobjectId = ownerObj[0]
                        const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                        const toobjectId = oId
                        const toobjectName = oName
                        if (debug) console.log('458 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                        if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName)        
                    } else {
                        const ownerObj = osduArray.find(o => o[1] === gparentKey)
                        const fromobjectId = ownerObj[0]
                        const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                        const toobjectId = oId
                        const toobjectName = oName
                        if (debug) console.log('466 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                        if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName) 
                    }
                } else if (oVal['$ref']) { // if the object is a reference, we have to find the object and create a relationship between the object and the reference object
                    const curtype = osduArray.find(o => o[1] === oKey)[2]?.type
                    if (!debug) console.log('470 ', curtype, parentName, gparentKey, topObjKey, oKey);
                    if (gparentKey === topObjKey) { // if granparent is the top object, it is the owner
                        const ownerObj = osduArray.find(o => o[1] === gparentKey)
                        const fromobjectId = ownerObj[0]
                        const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                        const toobjectId = oId
                        const toobjectName = oName
                        if (!debug) console.log('476 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                        if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName) 

                        // if parent type is undefined or null, the owner is the grandparent
                    } else if (!curtype) { 
                        const ownerObj = osduArray.find(o => o[1] === parentKey)
                        const fromobjectId = ownerObj[0]
                        const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                        const toobjectId = oId
                        const toobjectName = oName
                        if (!debug) console.log('488 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                        if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName) 

                    } else { // 
                        const ownerObj = osduArray.find(o => o[1] === gparentKey)
                        const fromobjectId = ownerObj[0]
                        const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                        const toobjectId = oId
                        const toobjectName = oName
                        if (!debug) console.log('496 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                        if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName) 
                        
                    }
                } else if (oName === 'items') { // if the greatgrandparent is items, we have to fine owner and create a relationship between the object and the owner object
                    const ownerObj = osduArray.find(o => o[1] === parentKey)
                    const fromobjectId = ownerObj[0]
                    const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                    const toobjectId = oId
                    const toobjectName = oName
                    if (debug) console.log('464 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                    if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName)        
                
                // } else if (oName.includes('Set') || oName.includes('ID')) {
                //     const ownerObj = osduArray.find(o => o[1] === gparentKey)
                //     const fromobjectId = ownerObj[0]
                //     const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                //     const toobjectId = oId
                //     const toobjectName = oName
                //     if (debug) console.log('440 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                //     createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName)     

                    
                }
            // })
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
            if (debug) console.log('513 :', obj, newobj);
            
            return newobj;
        }

        function process(key,value) { //called with every property and its value
            // if (key === "id") key = "$id"  // We will use our own uuid so rename if source has id
            // if (key === 'name' && (!value))  key = "contryName"
            const attribute = {[key]:value}
            return attribute
        }
    

    // reader.readAsText(e.target.files[0])


}

