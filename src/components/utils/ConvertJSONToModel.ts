// @ts-nocheck

const debug = false
import * as utils from '../../akmm/utilities';
import ObjectTable from '../table/ObjectTable';

// read and convert OSDU Json format


export const ReadConvertJSONFromFile = async (modelType, props, dispatch, e) => {
    e.preventDefault()
    const reader = new FileReader()

    const JsonObjectTypeId = ['379e9cf8-4481-4b1c-cd09-04924edb97d6', 'JsonObject']
    const JsonArrayTypeId = ['ca4b9d54-a585-4415-aa1b-e259c375c74f', 'JsonArray']
    const entityTypeId = ['31a18ce8-66cf-4b95-79e4-673746867ac3', 'Entity']
    const propertyTypeId = ['7e9386c9-75bc-4239-c040-d328f1c91e1b','Property']
    const hasPartTypeId = ['1507e682-1a4f-49cb-efe7-b2efcb3eb50c','hasPart']
    const hasMemberTypeId = ['40bd8511-8daf-452c-2e01-3bb3f4f0277c', 'hasMember']
    const hasTypeId = ['22f50fa8-90be-4738-8f71-670a19668fe0', 'has']

    const curModel = props.phData.metis.models.find(m => m.id === props.phFocus.focusModel.id)
    const curMetamodel = props.phData.metis.metamodels.find(mm => mm.id === curModel.metamodelRef)
    const curObjTypes = curMetamodel.objecttypes

    let objecttypeRef = JsonObjectTypeId // default partof relship in JSON structure
    let reltypeRef = hasPartTypeId // default partof relship in JSON structure

    // reader.fileName = file.name
    reader.onload = async (e) =>  { 
        const text = (e.target.result)
        const osduMod = JSON.parse(text) // importert JSON file
        if (!debug) console.log('32', osduMod,  osduMod["$id"], osduMod["x-osdu-schema-source"] );
        // if (osduMod["$id"]) console.log('20',  osduMod["$id"].split('/').slice(-1)[0]  );
        
        const topName = (osduMod["$id"]) ? osduMod["$id"].split('/').slice(-1)[0] : osduMod["x-osdu-schema-source"] 
        const topModel ={[topName]: osduMod} // top object is given topName as key 

        let parentId = null //topModel.id || osduMod["$id"]
        let oldParentKey = ""
        let prevId = ""
        let tmpArray = ""
        let entityId = ""

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
            
            while (++i !== len)
                if (typeof allkeys[i][1] === 'object' && allkeys[i][1] !== null){
                    curKey = allkeys[i][0]+ '';
                    nextKey = (allkeys[i+1]) ? allkeys[i+1][0]+ '' : '';
                    const jsonType = (Array.isArray(allkeys[i][1])) ? 'isArray' : 'isObject';
                    // curKey = allkeys[i][0] + '[';
                    Array.prototype.push.apply(
                        allkeys,
                        formatKeys( Object.entries(allkeys[i][1]) )
                    );
                    // console.log('35 :', i, entryK, len, curKey.slice(0, -1), allkeys[i][1]);
                    const cleanPath = curKey.slice(0, -1).replace(/"/g, '') // clean key path ; remove "" from curkey to get a clean key string with the path as curKey
                    const cleanNextPath = nextKey.slice(0, -1).replace(/"/g, '') // clean key path ; remove "" from curkey to get a clean key string with the path as curKey
                    
                    let osduId =  cleanPath
                    let newosduId
                    let newIdArray = osduId.split('|')
                    if  (osduId.includes("|definitions")) {
                        const [, ...rest] = newIdArray
                        newosduId = rest.join('|')
                    } else {
                        newosduId = osduId
                    } // split and slice it, pick last element 
                    // if  (osduId.includes("|definitions|")) osduId = osduId.split('|').slice(-1)[0] // split and slice it, pick last element 
                    // console.log('60 :', newosduId);
                    
                    let oKey = newosduId

                    const oName = oKey.split('|').slice(-1)[0] // objectName ; split and slice it, pick last element 
                    const parentKey = oKey.split('|').slice(0, -1).join('|') // parent path ; split and slice it, pick all exept last element and rejoin
                    let parentName = parentKey.split('|').slice(-1)[0] // parentName ; split and slice it, pick last element 
                    // console.log('53', parentKey.split('|'), parentKey.split('|').slice(0, -1));
                    
                    const oVal =  allkeys[i][1] // the object
                    // console.log('57 :', '\n cleanPath: ', cleanPath, '\n oKey: ', oKey, '\n parentKey: ', parentKey, '\n parentName: ', parentName, '\n oName : ', oName, '\n oVal: ', oVal, '\n parentId: ', parentId);
 
                    let cNewVal = filterObject(oVal)// remove objects as attributes

                    if (oName === 'required')  {
                        const attributes  = Object.assign(...Object.entries(obj).map(([k, v]) => (k !== (!isNaN(k))))); 
                        cNewVal = {...attributes, 'propNames': Object.values(oVal).toString()}
                    }
                    if (debug) console.log('93 : oKey', oKey, oName, '\n oVal : ', oVal,'\n cNewVal : ', cNewVal);

                    const objTypeName = (parentName === 'properties') 
                        ? 'Property'
                        : (oName === 'allOf' || oName === 'anyOf' || oName === 'oneOf' || oName === 'required') 
                            ? 'JsonArray'
                            : (modelType === 'AKM')
                                ? (i === 0) 
                                    ? 'Entity'
                                    : (oName === 'items') 
                                        ? 'Entity' 
                                        : 'JsonObject'
                                : 'JsonObject'

                    objecttypeRef = curObjTypes.find(ot => ot.name === objTypeName)?.id // find objecttypeRef for the objecttypeName

                    if (debug) console.log('115 : ', objTypeName, ' - ', objecttypeRef);
                    
                    // objecttypeRef = (parentName === "properties") ? propertyTypeId : (oName !== "allOf") ? JsonObjectTypeId : JsonArrayTypeId // if parent is property use property typeRef
                    // console.log('102 : ', parentName, oName, objecttypeRef);
                    
                    let compositeName  = oName // temporary puttin title etc into objname for readability - later replace with a JSON - objecttype for the object

                    reltypeRef = (parentName === 'allOf' || parentName === 'anyOf' || parentName === 'onOf')  ? hasMemberTypeId : hasPartTypeId // temporary set array to hasMember relship
                    if (debug) console.log('110', parentName, reltypeRef[1]);
                    
                    // check if the object is already in the phData
                    // console.log('102 : ', props);
                    // if ((oldParentKey !== "") && (oldParentKey.length < parentKey.length)) parentId = oId // oldId    

                    const existObj = curModel.objects.find( (o) => o.osduId === oKey )
                    // console.log('106 : ', existObj, oKey, existObj?.id);
                    
                    const oId = (existObj) ? existObj.id : utils.createGuid()

                    tmpArray = [...tmpArray, [oKey, oId] ]
                    console.log('139 ', tmpArray);           
                    
                    let importedObject, topLevelObjectId, entityName
                    
                    if (modelType === 'AKM') { // if AKM then just create the top level object with title as name + properties
                        
                        if (i === 0 || oName === 'items')  {

                            objecttypeRef = entityTypeId[0]
                            const parentName = parentKey.split('|').slice(-1)[0] // parentName ; split and slice it, pick 3 last element 
                            // console.log('163', i, parentName,);
                            entityName = (i === 0) ? cNewVal.title : parentName
                            entityId = oId
                            parentId =  (i === 0) ? null : parentId
                            // console.log('142 i', i, entityName, entityId);
                            reltypeRef = hasTypeId 

                            importedObject = {
                                id: oId,
                                name: entityName,
                                // name: compositeName,
                                // typeName: type,
                                typeRef: objecttypeRef,
                                abstract: false,
                                markedAsDeleted: false,
                                modified: true,
                                ...cNewVal // want only attributes 
                            }

                        } else if (parentName === 'properties') {

                            if (debug) console.log( '158 : ', compositeName, oId, parentId, entityId, parentName, tmpArray);
                            reltypeRef = hasTypeId             
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
                                ...cNewVal // want only attributes 
                            }
                        } else {
                            
                            continue;
                        }

                    } else {   // create the json objects 
                                
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
                    }
                    if (debug) console.log('58 :', importedObject);

                    dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: importedObject } );  

                    const parentIdArray = tmpArray.find( (o) => (o[0] === parentKey) && o) ;
                    parentId = (parentId === oId) ? null : (!parentId) ? null : (entityId) ? entityId : parentIdArray[1] 
                    // parentId = (entityId) ? entityId : (parentId) ? parentIdArray[1] : null  
                    parentName = (entityName) ? entityName : parentName 
                    
                    if (!debug) console.log('201 : name', compositeName, 'oId ',oId, 'parentId ', parentId, 'entityId ', entityId, 'reltRef ', reltypeRef[0]);
                    
                    importedRel = (parentId) 
                        ?   {
                                id: utils.createGuid(),
                                name: reltypeRef[1],
                                title: "",
                                cardinality: "",
                                cardinalityFrom: undefined,
                                cardinalityTo: undefined,
                                description: "",
                                fromobjectRef: parentId,
                                nameFrom: parentName,
                                generatedTypeId: "",
                                // id: parentKey+oKey,
                                markedAsDeleted: false,
                                modified: true,
                                relshipkind: "",
                                relshipviews: undefined,
                                toobjectRef: oId,
                                nameTo: oName,
                                typeRef: reltypeRef[0],
                            }  
                        :   {}

                    console.log('234 ', importedRel );
                    
                    (parentId) && dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: importedRel });

                    if (debug) console.log('129 ',
                        '\n oldParKey :', oldParentKey,  
                        '\n parKey : ', parentKey, 
                        '\n parName : ', parentName, 
                        '\n parId : ', parentId, 
                        '\n prevId : ', prevId,
                        '\n curId : ', oId,
                        '\n curName : ', oName);


                    let reltRef, importedRel



                   prevId = oId     
                   oldParentKey = parentKey // remember for next object
                }
            return allkeys;
        }

        deepEntries(topModel)

        function stringifyEntries(allkeys){
            return allkeys.reduce(function(acc, x){
                return acc+((acc&&'\n')+x[0])
            }, '');
        };
        // console.log('56 :', stringifyEntries(deepEntries(topModel))); 
    };

    reader.readAsText(e.target.files[0])
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


