// @ts-nocheck

const debug = false
import * as utils from '../../akmm/utilities';
import camelCase from 'camelcase';
import { ConnectImportedTopEntityTypes } from './ConnectImportedTopEntityTypes';
import { Dispatch } from 'redux';
import { cxValue } from '../../akmm/metamodeller';
// import ObjectTable from '../table/ObjectTable';
// import { FaAudioDescription } from 'react-icons/fa';

// read json file and convert OSDU Json format to AKM model
export const ReadConvertJSONFromFileToAkm = async (modelType: string, inclProps: boolean, props: { phData: { metis: { models: any[]; metamodels: any[]; }; }; phFocus: { focusModel: { id: any; }; }; ph: { phData: { metis: { models: any[]; metamodels: any[]; }; }; phFocus: { focusModel: { id: string; }; }; }; }, dispatch: Dispatch<any>, jsonFile: string) => {
    // console.log('11', jsonFile)

    // export const ReadConvertJSONFromFileToAkm = async (modelType, inclProps, props, dispatch, e) => {
    //     e.preventDefault()
    //     const files = e.target.files 
    //     console.log('13 ', files, e)
    //     const reader = new FileReader()

    const curModel = props.phData.metis.models.find((m: { id: any; }) => m.id === props.phFocus.focusModel.id)
    const objects = curModel.objects
    if (debug) console.log('14 ', props.phFocus.focusModel, curModel, props.phData.metis.models);
    
    const curMetamodel = props.phData.metis.metamodels.find((mm: { id: any; }) => mm.id === curModel.metamodelRef)
    const curObjTypes = curMetamodel.objecttypes
    const curRelTypes = curMetamodel.relshiptypes

    const JsonObjectType = curObjTypes.find((co: { name: string; }) => (co.name === 'JsonObject') && co)
    
    const entityType = curObjTypes.find((co: { name: string; }) => (co.name === 'EntityType') && co)
    const hasPartType = curRelTypes.find((co: { name: string; }) => (co.name === 'hasPart') && co)
    // const hasMemberType = curRelTypes.find(co => (co.name === 'hasMember') && co)
    const containsType = curRelTypes.find((co: { name: string; }) => (co.name === 'contains') && co)
    const hasType = curRelTypes.find((co: { name: string; }) => (co.name === 'has') && co)
    // console.log('38', hasPartType);
    let objecttypeRef = JsonObjectType?.id // default partof relship in JSON structure
    let reltypeRef = hasPartType?.id // default partof relship in JSON structure
    let reltypeName = hasPartType?.name // default partof relship in JSON structure
    const IsType = curRelTypes.find((co: { name: string; }) => (co.name === 'Is') && co)
    let relshipKind = 'Association' 
    let osduType = ''
    
    const createObject = (oId: any, oName: string, otypeRef: string, oKey: string, osduType: string, jsonType='object', cNewVal: {}) => {
        // console.log(' 44 createObject', oName, existObj);
        if (debug) console.log('51 createObject', oName, cNewVal);
        const importedObject = (modelType === 'AKM') // dont include json attributes
            ?   {
                    id: oId,
                    name: oName,
                    // typeName: type,
                    typeRef: otypeRef,
                    abstract: false,
                    markedAsDeleted: false,
                    modified: true,
                    externalID: oKey,
                    osduId: oKey,
                    osduType: osduType,
                    
                    // jsonType: jsonType,
                    // jsonKey: oName,
                    ...cNewVal // want only attributes 
                }
                :   {
                    id: oId,
                    name: oName,
                    // description: description,
                    // typeName: type,
                    typeRef: otypeRef,
                    abstract: false,
                    markedAsDeleted: false,
                    modified: true,
                    externalID: oKey,
                    osduId: oKey,
                    jsonType: jsonType,
                    jsonKey: oName,

                    ...cNewVal // want only attributes
                }            

        if (debug) console.log('68 Create object: ', importedObject.name, importedObject);             
        dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: importedObject } );  
        
        return importedObject
    }

    const createRel = (relId: string, typeName: any, description: string, title: string, reltypeRef: any, relKind: string, fromobjectId: any, fromobjectName: any, toobjectId: any, toobjectName: any) => {
                            
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

        if (debug) console.log('100 Create relship', fromobjectId, fromobjectName, importedRel.name, toobjectId, toobjectName );

        (fromobjectId && toobjectId) && dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: importedRel });

    }
        if (false) {
            // .-.-.-.-.-.-.-.-.-. imported from generated folder in gitlab -.-.-.-.-.-.-.-
            // hardcoded content add ../abstract/AbstractSystemProperties.json to the file
            // if  $id contains master-data or work-product-component or work-product then add the file to the model
            let newOsduMod =osduMod
            if (osduMod['$id'].includes('master-data') || osduMod['$id'].includes('work-product-component') || osduMod['$id'].includes('work-product')) {
                
                if (osduMod.hasOwnProperty('data')) { // move allOff up to top level and remove data, to make genrerated the same as authoring i osdu 
                    console.log('151 found osduMod[data], it must be a grenerated not authoring', osduMod['data'])
                    // remove data move content to top and remove data from the jsonobject
                    const allOf = osduMod['data']['allOf']
                    const data = osduMod.data
                    delete osduMod.data
                    newOsduMod = {...osduMod, ...allOf}
                }
                
                const aspObj = JSON.parse(`{ "$ref": "../abstract/AbstractSystemProperties.1.0.0.json" }`) // insert abstractSystemProperties into the jsonobject
                // const aspObj = JSON.parse(`{ "$ref": "../abstract/AbstractSystemProperties.1.0.0.json" }`)
                if (debug) console.log('155 ', osduMod, aspObj)

                // move allOf to data
                // const data = osduMod.allOf
                // newOsduMod.data = data
                // remover allOf from newOsduMod
                newOsduMod.allOf = [...osduMod.allOf, aspObj]
                console.log('165 ', newOsduMod)
            }

            if (debug) console.log('32', newOsduMod, newOsduMod["$id"], newOsduMod["x-osdu-schema-source"] );
            // if (osduMod["$id"]) console.log('20',  osduMod["$id"].split('/').slice(-1)[0]  );
            
            const topName = (newOsduMod["$id"]) ? newOsduMod["$id"].split('/').slice(-1)[0] : newOsduMod["x-osdu-schema-source"] 
            const topModel ={[topName]: newOsduMod} // top object is given topName as key 
        }
        // const osduMod = JSON.parse(jsonFile) // importert JSON file
        // if (debug) console.log('121 osduMod', osduMod)

        const osduMod = JSON.parse(jsonFile.toString()) // importert JSON file
        if (debug) console.log('121 osduMod', osduMod)
    
        let parentId = null //topModel.id || osduMod["$id"]
        let mainArray = []
        let entityName: string
    
        // deepEntries take all object-keys and concatinate them in curKey as a path showing all above levels and put them in a new array
        // example: deepEntries
        //    0: (2) ['846aa642-1ae5-4deb-3cbb-cb7f26615838','Well.1.0.0.json',{$id: 'https://schema.osdu.opengroup.org/json/master-data/Well.1.0.0.json', $schema: 'http://json-schema.org/draft-07/schema#', title: 'Well', description: 'The origin of a set of wellbores.', type: 'object', …}
        //    1: (2) ['fc76c04d-0379-4301-b7cd-d68d861d47f6','Well.1.0.0.json|allOf',  .....]
        //    2: (2) ['20200684-f5d4-460b-0f2e-8f4dcaac0441', 'Well.1.0.0.json|allOf|0',  .......]
        // the curKey is put in a array "allKeys" with curKey as first and the object id as second,and the content i.e. an object as third. 
    
        // if  $id contains master-data or work-product-component or work-product then add the file to the model
        // if (osduMod['$id']?.includes('master-data') || osduMod['$id']?.includes('work-product-component') || osduMod['$id']?.includes('work-product')) {  // removed:  we use all files
        // console.log('141 osduMod', ('data' in osduMod) )
        console.log('142 osduMod', osduMod, osduMod.data, osduMod.properties )
        console.log('140 osduMod', osduMod, osduMod.hasOwnProperty('data'))
        if (osduMod.properties?.data !== undefined) { // if data is defined in the json file its a generated where all props are in data
            if (osduMod.hasOwnProperty('properties')) { // if skip system properties from the gererated json files
                    delete osduMod.properties['id'] 
                    delete osduMod.properties['kind'] 
                    delete osduMod.properties['version'] 
                    delete osduMod.properties['acl'] 
                    delete osduMod.properties['legal'] 
                    delete osduMod.properties['tags'] 
                    delete osduMod.properties['createTime'] 
                    delete osduMod.properties['createUser'] 
                    delete osduMod.properties['modifyTime'] 
                    delete osduMod.properties['modifyUser'] 
                    delete osduMod.properties['ancestry'] 
                    delete osduMod.properties['meta'] 
                    console.log('155', osduMod)
            }
            // move content of data to top and then remove the data from the jsonobjecth
            const allOf = osduMod.properties['data']['allOf']
            // osduMod.properties = {...osduMod.properties, allOf}
            delete osduMod.properties
            console.log('142 allOf', allOf)
    
            // hardcoded content add ../abstract/AbstractSystemProperties.json to the file
            const aspObj = JSON.parse(`{ "$ref": "../abstract/AbstractSystemProperties.1.0.0.json" }`) // insert abstractSystemProperties into the jsonobject
    
            osduMod['allOf'] = [...allOf, aspObj]
            if (debug) console.log('150 ', osduMod, aspObj)
                

        }

        console.log('155 osduMod', osduMod )
        let newOsduMod = osduMod
        const externalID = newOsduMod.id || newOsduMod["$id"]
        newOsduMod.externalID = externalID;
        newOsduMod.name = (newOsduMod.id) ? newOsduMod.id.split(':').slice(-1)[0] : newOsduMod.title
        // newOsduMod.id = null // remove id , it will be generated by the uuid function as AKMM id, the osdu id is put in the externalID
        
        if (debug) console.log('165', newOsduMod, newOsduMod["$id"], newOsduMod["x-osdu-schema-source"] );
        // if (osduMod["$id"]) console.log('20',  osduMod["$id"].split('/').slice(-1)[0]  );
        
    
        const topName = (newOsduMod["$id"]) ? newOsduMod["$id"].split('/').slice(-1)[0] : (newOsduMod.id) ? newOsduMod.id.split(':').slice(-1)[0] : null
        if (debug) console.log('170',  topName , newOsduMod);
        // const topName = (newOsduMod["$id"]) ? newOsduMod["$id"].split('/').slice(-1)[0] :  newOsduMod["x-osdu-schema-source"] 
        const topModel ={[topName]: newOsduMod} // top object is given topName as key 
        if (debug) console.log('173', topModel);
    
        function deepEntries( obj: { [x: number]: any; } ) { // obj is the object to be traversed

            'use-strict';
            var allkeys: any, curKey = '', len = 0, i = -1, entryK: number;
            if (debug) console.log('175 deepEntries', obj);
            function formatKeys( entries: string | any[] ){
            entryK = entries.length;
            len += entries.length;
            while (entryK--)
                entries[entryK][0] = curKey+JSON.stringify(entries[entryK][0])+'|'; // concatinate curKey with | as divider
            return entries;
            }
            allkeys = formatKeys( Object.entries(obj || {}) )
            if (debug) console.log( '193 allkeys : ', allkeys);
            allkeys = allkeys.sort((firstItem: { key: number; }, secondItem: { key: number; }) => firstItem.key < secondItem.key);
            
            if (debug) console.log( '196 allkeys sorted: ', allkeys);

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
                    if (debug) console.log('210 :', i, entryK, len, curKey.slice(0, -1), allkeys[i][1]);

                    // make a unique osduId for each object in the JSON-file by concatinating the path to the object with the name its keys
                    // clean up the key path by removing the " in "key" first
                    const cleanPath = curKey.slice(0, -1).replace(/"/g, '') // clean key path ; remove "" from curkey to get a clean key string with the path as curKey

                    let osduId =  cleanPath
                    let newosduId: string
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
                    // if (debug) console.log('194 :', '\n cleanPath: ', cleanPath, '\n oKey: ', oKey, '\n oName : ', oName, '\n oVal: ', oVal, '\n parentKey: ', parentKey, '\n parentId: ', parentId, '\n parentName: ', parentName);

                    // let cNewVal = filterObject(oVal)// we only want attributes in cNewVal (objects are handled in the next iteration)

                    // check if the object is already in the phData
                    if (debug) console.log('241 : ', oKey, curModel.objects.find((o: { name: string; }) => o.name === oKey?.split('|')?.slice(-1)[0].split('.')[0] && o));
                    
                    // the osduId is lost so we have to find the object with the name and that has the same parentId as the object we are currently working on

                    // const existName = curModel.objects.find((o: { name: string; }) => o.name === oKey?.split('|')?.slice(-1)[0].split('.')[0] && o) // use name as key to find the object in the model
                    // const existParent = curModel.objects.find((o: { name: string; }) => o.name === otKey?.split('|')?.slice(-1)[0].split('.')[0] && o) // use name as key to find the object in the model

                    // const existFromobject  

                    const existObj = curModel.objects.find((o: { osduId: any; }) => o.osduId === oKey && o)  
                    const oId = (existObj) ? existObj.id : utils.createGuid()
                    if (debug) console.log('244 : ',  existObj, existObj?.id, oId, oKey, oVal );

                    mainArray = [...mainArray, [oId, oKey, oVal] ] // we add the oId to the oKey and oVal in the mainArray so we can search for the id by oKey (the total path id)
                    if (debug) console.log('249 ', mainArray );   
                }
                return mainArray
        }
    
        const osduArray = deepEntries(topModel) // find all the objects in the topModel and down the tree
        if (debug) console.log('255 deepEntries', osduArray);

        // map through the osduArray and create objects and relationships between the objects
        const osduObjects = osduArray?.map( (osduObj, index) => {
            const [oId, oKey, oVal] = osduObj
            let oName = oKey?.split('|')?.slice(-1)[0] // objectName ; split and slice it, pick last element
            if (debug) console.log('261 :', oName, oKey, oVal);
            // const cNewVal = filterObject(oVal) // filter away subobjects, we only want attributes in cNewVal (objects are handled in the next iteration)
            const cNewVal = filterObject(oVal) // filter away subobjects, we only want attributes in cNewVal (objects are handled in the next iteration)
            const parentName = oKey?.split('|')?.slice(-2,-1)[0] // parentName ; split and slice it, pick second last element
            const jsonType = (Array.isArray(oVal)) ? 'isArray' : 'isObject';

            // ==================== -------------------- ==================== -------------------- ====================

            // first we create the objects ----------------------------------------------------------------------
            if (index === 0) { // the first object is the in the json file (topObj)
                //  Set tobObjName = all before dot
                let topObjName = oName.split('.')[0] // remove the version number from the name
                // get type from the objects $id attribute and pick the second last element of the path which is the folder name
                const entityPathElement = (oVal.$id) ? oVal.$id.split('/').slice(-2)[0] : '' ;// filter out the pathelement from the file path i.e master-data 
                osduType = camelCase(entityPathElement, {pascalCase: true}) // convert to pascalCase i.e. master-data -> MasterData
                if (osduType === 'Abstract') cNewVal.abstract = true // if the object is abstract, set the abstract property to true
                // if (objTypeElementName === 'ReferenceData') cNewVal.abstract = true // if the object is abstract, set the abstract property to true
                // console.log('221 objTypeElementName', objTypeElementName, cNewVal);
                objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'EntityType')?.id // find objecttypeRef for the objecttypeName
                // objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === objTypeElementName)?.id || curObjTypes.find((ot: { name: string; }) => ot.name === 'EntityType')?.id // find objecttypeRef for the objecttypeName
                // Hardcoded: we will remove the Abstract from objectName 
                if (topObjName.includes('Abstract')) {
                    if (topObjName == 'AbstractWorkProductComponent') { // we don't want to create a type WorkproductComponent. It is already a type.
                        // lieve it as it is
                    } else {
                        topObjName = topObjName.replace('Abstract', '')
                        cNewVal.abstract = true
                    }
                }
                // if (debug) console.log('301 :', oName, oKey, osduType,  oVal, cNewVal);
                createObject(oId, topObjName, objecttypeRef, oKey, osduType, jsonType, cNewVal) // create the top object   
                console.log('337 topObject', oId, oName, objecttypeRef,oKey, osduType, jsonType, cNewVal);

            } else if (parentName === 'properties') { // this is property and proplink objectsƒ    
                if (debug) console.log('340 ', oName, oVal);
                if (oVal['x-osdu-relationship']) { // if the value is a relationship (this can replace all if statements for proplink below)
                    // loop through the childarray and create the relationship objects
                    oVal['x-osdu-relationship'].map((rel: { type: string; }) => {
                        objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'PropLink')?.id
                        if (debug) console.log('324  relationship', rel, objecttypeRef);
                        // objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'PropLink')?.id
                        if (oName.includes('IDs') || oName.includes('ID')) { // if the name contains ID, its a link to another object "ObjectName"-ID
                            cNewVal.linkID = oName.replace('IDs', '') // remove IDs from the name
                            cNewVal.linkID = oName.replace('ID', '') // remove ID from the name
                        } else {
                            cNewVal.linkID = oName
                        }
                        if (debug) console.log('324 relationship', oId, oName, objecttypeRef, oKey, rel.type, jsonType, cNewVal);
                        const propLinkName = 'has'+oName
                        // hardcoded transformation of the name
                        // i.e. if o.linkID is = 'Company' then transform to 'Organisation'   
                        if (cNewVal.linkID === 'Company') {cNewVal.linkID = 'Organisation'}
                        if (cNewVal.linkID === 'Owner') {cNewVal.linkID = 'Organisation'}
                        if (cNewVal.linkID === 'ServiceCompany') {cNewVal.linkID = 'Organisation'}
                        if (cNewVal.linkID === 'ParentProject') {cNewVal.linkID = 'Project'}
                        if (cNewVal.linkID === 'StationPropertyUnit') {cNewVal.linkID = 'UnitOfMeasure'}
                        if (cNewVal.linkID === 'TrajectoryStationPropertyType') {cNewVal.linkID = 'TrajectoryStationPropertyType'}
                        if (cNewVal.linkID === 'SurveyToolType') {cNewVal.linkID = 'SurveyToolType'}
                        if (cNewVal.linkID === 'Target') {cNewVal.linkID = 'GeometricTargetSet'}
                        if (cNewVal.linkID === 'GeographicCRS') {cNewVal.linkID = 'CoordinateReferenceSystem'}
                        if (cNewVal.linkID === 'ProjectedCRS') {cNewVal.linkID = 'CoordinateReferenceSystem'}
                        if (cNewVal.linkID === 'Feature') {cNewVal.linkID = 'LocalRockVolumeFeature'}
                        if (cNewVal.linkID === 'ColumnStratigraphicHorizonTop') {cNewVal.linkID = 'HorizonInterpretation'}
                        if (cNewVal.linkID === 'ColumnStratigraphicHorizonBase') {cNewVal.linkID = 'HorizonInterpretation'}
                        if (cNewVal.linkID === 'Interpretation') {cNewVal.linkID = 'HorizonInterpretation'}
                        if (cNewVal.linkID === 'RockVolumeFeature') {cNewVal.linkID = 'RockVolumeFeature'}
                        if (cNewVal.linkID === 'MarkerPropertyUnit') {cNewVal.linkID = 'UnitOfMeasure'}
                        if (cNewVal.linkID === 'WellLogType') {cNewVal.linkID = 'LogType'}
                        if (cNewVal.linkID === 'SamplingDomainType') {cNewVal.linkID = 'WellLogSamplingDomainType'}
                        if (cNewVal.linkID === 'StartMarkerSet') {cNewVal.linkID = 'WellboreMarkerSet'}
                        if (cNewVal.linkID === 'StopMarkerSet') {cNewVal.linkID = 'WellboreMarkerSet'}
                        if (cNewVal.linkID === 'StartMarker') {cNewVal.linkID = 'Marker'}
                        if (cNewVal.linkID === 'StopMarker') {cNewVal.linkID = 'Marker'}
                        if (cNewVal.linkID === 'StartBoundaryInterpretation') {cNewVal.linkID = 'HorizonInterpretation'}
                        if (cNewVal.linkID === 'StopBoundaryInterpretation') {cNewVal.linkID = 'HorizonInterpretation'}
                        
                        createObject(oId, propLinkName, objecttypeRef, oKey,  osduType, jsonType, cNewVal) // create the relationship objects
                        if (debug) console.log('383 not ID ', oId, propLinkName, objecttypeRef,oKey, jsonType, cNewVal);
                        findOwnerandCreateRelationship(osduObj)
                    });
                  
                } else if (oVal.type === 'array') { // if the value is an array we create a collection object
                    // oName includes char Set as the last characters of the name
                    if (debug) console.log('293  array Set: ', oId, oName, objecttypeRef, oKey, jsonType, cNewVal, oVal);
                    if (debug) console.log('294 :', parentName.substring(parentName.length-3))
                    if ((oName.substring(oName.length-3) === 'Set') || (oName === 'Markers')){ // make a collection object
                        objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'Collection')?.id
                        cNewVal.viewkind = 'container'
                        createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, cNewVal) // create the collection objects
                        if (debug) console.log('299  array Set', oId, oName, objecttypeRef, oKey, jsonType, cNewVal);
                        findOwnerandCreateRelationship(osduObj)
                    } else if (oName.includes('ID') || oName.includes('IDs')) { // is this working? when ID its not an array? -------------------------
                        if (oName === 'MarkerID' || oName === 'IntervalID')  {
                            // do nothing
                        } else {
                            if (debug) console.log('275  array', oId, oName, oKey, jsonType, cNewVal);
                            objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'PropLink')?.id
                            let linkID = oName.replace('ID', '') // remove iD from the name
                            const propLinkName = 'has' + oName
                            cNewVal.linkID = oName
                            if (debug) console.log('277  array', oName, linkID, cNewVal);
                            createObject(oId, propLinkName, objecttypeRef, oKey, osduType, jsonType, cNewVal) // create the collection objects
                            if (debug) console.log('309  array ID', oId, propLinkName, objecttypeRef, oKey, jsonType, cNewVal);
                            findOwnerandCreateRelationship(osduObj)
                        }
                    } else if (cNewVal['$ref']) { // if the value is a reference we create a EntityType object
                        objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'PropCollection')?.id  // change from EntityType
                        createObject(oId, oName, objecttypeRef, oKey,  osduType, jsonType, cNewVal) // create the reference objects
                        if (debug) console.log('319  array $ref', oId, oName, objecttypeRef, oKey, jsonType, cNewVal);
                        findOwnerandCreateRelationship(osduObj)
                    } else {
                        if (debug) console.log('389  array', oId, oName, oKey, jsonType);
                        objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'PropCollection')?.id // changed from EntityType
                        if (oName === 'Markers') oName =  oName.substring(0, oName.length-1) // remove the last character from the name
                        createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, cNewVal) // create the reference objects
                        if (debug) console.log('320  array else', oId, oName, objecttypeRef, oKey, jsonType, cNewVal);
                        findOwnerandCreateRelationship(osduObj)
                    }
                } else if (oVal.type === 'string' || oVal.type === 'nunber' || oVal === 'integer' ) { // || oVal === 'integer' || oVal === 'number' || oVal === 'boolean' || oVal === 'array' || oVal === 'object') { // if the value is a primitive type    
                    if (debug) console.log('321  primitive', oId, oName, oKey, jsonType, cNewVal);              
                    if (oName.includes('IDs') || oName.includes('ID')) { // if the name contains ID, its a link to another object "ObjectName"-ID
                        const propLinkName = 'has'+oName

                        objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'PropLink')?.id
                        cNewVal.linkID = oName.replace('IDs', '') // remove IDs from the name
                        cNewVal.linkID = oName.replace('ID', '') // remove ID from the name
                        if (debug) console.log('322 ', oName, cNewVal);
                        // hardcoded transformation of the name
                        // i.e. if o.linkID is = 'Company' then transform to 'Organisation'   
                        if (cNewVal.linkID === 'Company') {cNewVal.linkID = 'Organisation'}
                        if (cNewVal.linkID === 'ServiceCompany') {cNewVal.linkID = 'Organisation'}
                        if (cNewVal.linkID === 'ParentProject') {cNewVal.linkID = 'Project'}
                        if (cNewVal.linkID === 'StationPropertyUnit') {cNewVal.linkID = 'UnitOfMeasure'}
                        if (cNewVal.linkID === 'TrajectoryStationPropertyType') {cNewVal.linkID = 'TrajectoryStationPropertyType'}
                        if (cNewVal.linkID === 'SurveyToolType') {cNewVal.linkID = 'SurveyToolType'}
                        if (cNewVal.linkID === 'GeographicCRS') {cNewVal.linkID = 'CoordinateReferenceSystem'}
                        if (cNewVal.linkID === 'ProjectedCRS') {cNewVal.linkID = 'CoordinateReferenceSystem'}
                        if (cNewVal.linkID === 'Feature') {cNewVal.linkID = 'LocalRockVolumeFeature'}
                        if (cNewVal.linkID === 'ColumnStratigraphicHorizonTop') {cNewVal.linkID = 'HorizonInterpretation'}
                        if (cNewVal.linkID === 'ColumnStratigraphicHorizonBase') {cNewVal.linkID = 'HorizonInterpretation'}
                        if (cNewVal.linkID === 'Interpretation') {cNewVal.linkID = 'HorizonInterpretation'}
                        if (cNewVal.linkID === 'RockVolumeFeature') {cNewVal.linkID = 'RockVolumeFeature'}
                        if (cNewVal.linkID === 'MarkerPropertyUnit') {cNewVal.linkID = 'UnitOfMeasure'}
                        if (cNewVal.linkID === 'WellLogType') {cNewVal.linkID = 'LogType'}
                        if (cNewVal.linkID === 'SamplingDomainType') {cNewVal.linkID = 'WellLogSamplingDomainType'}
                        if (cNewVal.linkID === 'StartMarkerSet') {cNewVal.linkID = 'WellboreMarkerSet'}
                        if (cNewVal.linkID === 'StopMarkerSet') {cNewVal.linkID = 'WellboreMarkerSet'}
                        if (cNewVal.linkID === 'StartMarker') {cNewVal.linkID = 'Marker'}
                        if (cNewVal.linkID === 'StopMarker') {cNewVal.linkID = 'Marker'}
                        if (cNewVal.linkID === 'StartBoundaryInterpretation') {cNewVal.linkID = 'HorizonInterpretation'}
                        if (cNewVal.linkID === 'StopBoundaryInterpretation') {cNewVal.linkID = 'HorizonInterpretation'}
                        // if (cNewVal.linkID === 'GeologicUnitInterpretation') {cNewVal.linkID = 'GeologicUnitInterpretation'} // TODO: check if this is correct
                        if (debug) console.log('346  ', cNewVal);

                        createObject(oId, propLinkName, objecttypeRef, oKey, osduType, jsonType, cNewVal) // create the property objects
                        if (debug) console.log('352 ID', oId, propLinkName, objecttypeRef, oKey, jsonType, cNewVal);
                        findOwnerandCreateRelationship(osduObj)
                    } else if (oName.substring(oName.length- 4) === 'Type'){ // check if last part of the oName is the characters "Type", its a link to another object "ObjectName"with TYPE included
                        cNewVal.linkID = oName
                        const propLinkName = 'has'+oName
                        objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'PropLink')?.id
                        createObject(oId, propLinkName, objecttypeRef, oKey,  osduType, jsonType, cNewVal) // create the property objects
                        if (debug) console.log('359 TYPE', oId, propLinkName, objecttypeRef,oKey, jsonType, cNewVal);
                        findOwnerandCreateRelationship(osduObj)
                    } else { // if the name does not contain ID or Type, we create a property object
                        objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'Property')?.id
                        createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, cNewVal) // create the property objects
                        if (debug) console.log('464 not ID ', oId, oName, objecttypeRef,oKey, jsonType, cNewVal);
                        findOwnerandCreateRelationship(osduObj)
                    }
                } else {
                    objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'Property')?.id
                    createObject(oId, oName, objecttypeRef, oKey,  osduType, jsonType, cNewVal) // create the collection objects
                    if (debug) console.log('315  array', oId, oName, objecttypeRef,oKey, jsonType, cNewVal);
                    findOwnerandCreateRelationship(osduObj)
                }
            } else if (oVal['$ref']) { // this is a reference to another object (abstract)
                const objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'PropLink')?.id
                const typeRest = oVal['$ref'].split('/').slice(-1)[0]
                cNewVal.title = (typeRest) && typeRest.split('.')[0] 
                const typeRestNoDot = (typeRest) && typeRest.split('.')[0]
                cNewVal.linkID = (typeRestNoDot) && (typeRestNoDot === 'AbstractWorkProductComponent') ? typeRestNoDot : typeRestNoDot.replace('Abstract', '')

                const entityName = 'Is'+cNewVal.title
                createObject(oId, entityName, objecttypeRef, oKey, osduType, jsonType, cNewVal) // create the reference objects               
                if (debug) console.log('330 $ref', oId, entityName, objecttypeRef,oKey, jsonType, cNewVal);  
                findOwnerandCreateRelationship(osduObj)
            } else if (oName === 'items') { // Items
                let gchildKeyName: string, gchildKeyNameId: string
                if (debug) console.log('383  items', parentName.substring(oName.length-3));
                if (parentName.substring(parentName.length-3) === 'Set'){ // check if last part of the oName is the characters "Set", its a link to another object "ObjectName"with Set included') 
                    const linkedName = parentName.substring(0, parentName.length-3) // remove the last 3 characters "Set", leaving the name of the object to link to
                    const propLinkName = 'has'+linkedName
                    objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'PropLink')?.id
                    cNewVal.linkID = linkedName
                    createObject(oId, propLinkName, objecttypeRef, oKey, osduType, jsonType, cNewVal) // create the property objects
                    if (debug) console.log('349 Set', oId, propLinkName, objecttypeRef,oKey, jsonType, cNewVal);
                    findOwnerandCreateRelationship(osduObj)
                } else if (parentName === 'Markers' || parentName === 'Intervals' || parentName?.includes('IDs') ){ // Special case for Markers, Intervals or containing IDs   
                    const oMName  = parentName.substring(0, parentName.length-1) // remove the last plural character s
                    objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'PropCollection')?.id
                    reltypeRef = containsType?.id
                    reltypeName = containsType?.name
                    relshipKind = 'Association'
                    createObject(oId, oMName, objecttypeRef, oKey, osduType, jsonType, cNewVal) // create the property objects
                    if (debug) console.log('398 Markers', oId, oMName, objecttypeRef,oKey, jsonType, cNewVal);
                    findOwnerandCreateRelationship(osduObj)
                } else if (oVal.allOf) { // 
                    gchildKeyNameId = Object.keys(oVal?.allOf[0]?.properties).find(k => k.includes('ID')) 
                    gchildKeyName = gchildKeyName?.replace('ID', '')
                    objecttypeRef = curObjTypes.find((ot: { name: string; }) => ot.name === 'PropLink')?.id // find objecttypeRef
                    if (gchildKeyName) {
                        entityName =    'Is'+gchildKeyName
                        cNewVal.title = gchildKeyNameId
                        cNewVal.linkID = gchildKeyNameId
                        // objecttypeRef = (gchildKeyName === '$ref') ? curObjTypes.find(ot => ot.name === 'PropLink')?.id  : curObjTypes.find(ot => ot.name === objTypeName)?.id // find objecttypeRef for the objecttypeName
                        reltypeRef = containsType?.id 
                        reltypeName = containsType?.name
                        relshipKind = 'Association'
                        createObject(oId, entityName, objecttypeRef, oKey, jsonType, cNewVal) // create the reference objects               
                        // console.log('278 $ref', oId, entityName, objecttypeRef,oKey, jsonType, cNewVal);  
                        findOwnerandCreateRelationship(osduObj)
                    } 
                }
            } else { // the rest we dont make objects for
                    if (debug) console.log('376 no obj', oId, oName, objecttypeRef,oKey, jsonType, cNewVal);  
                    // createObject(oId, entityName, objecttypeRef, oKey, osduType, jsonType, cNewVal) // create the reference objects  
            }
        })

        // -----------------------------------------------------------------------------------------------------------------
        // crate relationships between objects
        // create function findOwnerandCreateRelationship(oId, oKey)
        function findOwnerandCreateRelationship(osObj: [any, any, any]) {
            if (debug) console.log('432 ', osObj);
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
            const gggggparentKey = oKey.split('|').slice(0,-6).join('|') // find greatgreatgreatgreatgr andparent key by splitting the oKey and remove the last six elements

            const relId = utils.createGuid()
            const relDescription = ''
            const relTitle = ''
            reltypeRef = hasType?.id
            reltypeName = hasType?.name      
            relshipKind = 'Association'   

            if (debug) console.log('390 parentName', gggparentName, ggparentName, gparentName, parentName);

            // console.log('322  ', osduArray.find(o => o[1] === ggparentKey)[2]) //?.type === 'object')
            if (parentName === 'properties') { // if the parent is properties, we have to find owner and create a relationship between the object and the owner object    
                if (debug) console.log('473 ', oName, parentName, gparentName, ggparentName, oKey );
                if (gparentKey === topObjKey) { // if granparent is the top object, it is the owner
                    const fromobjectId = topObjId
                    const fromobjectName = topObjName
                    const toobjectId = oId
                    const toobjectName = oName
                    if (debug) console.log('472 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId, oVal);
                    // (fromobjectId !== toobjectId) && 
                    if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName)  

                } else if (gggparentKey === topObjKey) { // if gggparentKey is the same as topObjKey, we use the topObj as owner
                    // console.log('322', gggparentKey, parentName,  topObjKey );
                    const fromobjectId = topObjId
                    const fromobjectName = topObjName
                    const toobjectId = oId
                    const toobjectName = oName
                    if (debug) console.log('482 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                    // (fromobjectId !== toobjectId) && 
                    if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName) 

                } else if (gparentName === 'items') { // && ggparentName === 'Markers') { // if the greatgrandparent is items, we have to find owner and create a relationship between the object and the owner object
                    const ownerObj = osduArray.find(o => o[1] === gparentKey)
                    const fromobjectId = ownerObj[0]
                    const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                    const toobjectId = oId
                    const toobjectName = oName
                    if (debug) console.log('587 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                    if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName)
                } else if (gparentName === 'items' || ggparentName === 'properties') { // if the gparent is items, we have to find owner 
                    let ownerObj: string[], fromobjectId: string, fromobjectName: string
                    if (ggparentName === 'properties') { // if the greatgrandparent is properties, we have to find owner and create a relationship between the object and the owner object
                        ownerObj = osduArray.find(o => o[1] === parentKey)
                        fromobjectId = ownerObj[0]
                        fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                    } else if (ggparentName === 'Markers') { // if the greatgrandparent is Markers, we have to fcreate a relationship between the object and the top object 
                        ownerObj = osduArray.find(o => o[1] === parentKey)
                        fromobjectId = ownerObj[0]
                        fromobjectName = ownerObj[1].substring(0, ownerObj[1].length - 1) // remove the last character plural s to get linkobjectName
                    } else {
                        ownerObj = osduArray.find(o => o[1] === ggparentKey)
                        fromobjectId = ownerObj[0]
                        fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                    }
                    if (debug) console.log('493', gparentKey, parentName, topObjKey );               
                    const toobjectId = oId
                    const toobjectName = oName  
                    if (debug) console.log('498 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                    if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName) 

                } else if (gggparentName === 'items') { // if the greatgrandparent is items, we have to find owner and create a relationship between the object and the owner object
                    const ownerObj = osduArray.find(o => o[1] === ggggparentKey)
                    const fromobjectId = ownerObj[0]
                    const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                    const toobjectId = oId
                    const toobjectName = oName
                    if (debug) console.log('587 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                    if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName)           
                } else {
                    const ownerObj = osduArray.find(o => o[1] === gparentKey)
                    const fromobjectId = ownerObj[0]
                    const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                    const toobjectId = oId
                    const toobjectName = oName
                    if (debug) console.log('515 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                    if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName) 
                }
            } else if (oVal['$ref']) { // if the object is a reference, we have to find the object and create a relationship between the object and the reference object
                const curtype = osduArray.find(o => o[1] === oKey)[2]?.type
                if (debug) console.log('470 ', curtype, parentName, gparentKey, topObjKey, oKey);
                if (parentName === 'data') { // if parent is the data, it is the owner
                    const ownerObj = osduArray.find(o => o[1] === parentKey)
                    const fromobjectId = ownerObj[0]
                    const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                    const toobjectId = oId
                    const toobjectName = oName
                    if (debug) console.log('476 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                    if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName) 
                } else if (gparentKey === topObjKey) { // if granparent is the top object, it is the owner
                    const ownerObj = osduArray.find(o => o[1] === gparentKey)
                    const fromobjectId = ownerObj[0]
                    const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                    const toobjectId = oId
                    const toobjectName = oName
                    if (debug) console.log('476 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                    if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName) 
                    // if parent type is undefined or null, the owner is the grandparent
                } else if (!curtype) { 
                    const ownerObj = osduArray.find(o => o[1] === parentKey)
                    const fromobjectId = ownerObj[0]
                    const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                    const toobjectId = oId
                    const toobjectName = oName
                    if (debug) console.log('488 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                    if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName) 
                } else { // 
                    const ownerObj = osduArray.find(o => o[1] === gparentKey)
                    const fromobjectId = ownerObj[0]
                    const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                    const toobjectId = oId
                    const toobjectName = oName
                    if (debug) console.log('496 ---------',fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
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
            } 
        }

        // ConnectImportedTopEntityTypes("JSON", inclProps, props, dispatch)  // this will be run as a separate command
        
        // filter to get only attributes (objects removed)
        function filterObject(obj: { [x: string]: any; hasOwnProperty: (arg0: string) => any; }) {
            let newobj = {}
            for (var i in obj) {
                if (!obj.hasOwnProperty(i)) continue;
                if (typeof obj[i] == 'object') continue;
                const tmpkey = i
                // if (i === 'type') tmpkey = 'osduType' // type is a akmm attribute probably not the same as osdu attribute

                newobj = {
                    ...newobj,
                    [tmpkey]: obj[i]
                }
                if (debug) console.log('130', i, obj[i], newobj);
            }
            if (debug) console.log('513 :', obj, newobj);
            
            return newobj;
        }

        function process(key: any,value: any) { //called with every property and its value
            // if (key === "id") key = "$id"  // We will use our own uuid so rename if source has id
            // if (key === 'name' && (!value))  key = "contryName"
            const attribute = {[key]:value}
            return attribute
        }
}



