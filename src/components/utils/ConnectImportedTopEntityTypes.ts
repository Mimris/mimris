// @ts- nocheck

const debug = false
import * as utils from '../../akmm/utilities';
import ObjectTable from '../table/ObjectTable';

// connect top EntityObjects 
// find objects of type 'property' and with a name that includes the text 'ID' and remove that text and find the EtityType object with the rest name
// then traverse upwords and find the top object with type "EntityType"  
// then add a relship between the two objects i.e. the "rest EntityType" and the top EntityType
export const ConnectImportedTopEntityTypes = async (modelType, inclProps, props, dispatch) => {

    console.log('13 ', props);

    const curModel = props.phData.metis.models.find(m => m.id === props.phFocus.focusModel.id)
    const curObjects = curModel.objects
    const curRelships = curModel.relships

    //console.log('23 ', props.phFocus.focusModel, curModel, props.phData.metis.models);
    
    const curMetamodel = props.phData.metis.metamodels.find(mm => mm.id === curModel.metamodelRef)
    const curObjTypes = curMetamodel.objecttypes
    const curRelTypes = curMetamodel.relshiptypes


    const JsonObjectType = curObjTypes.find(co => (co.name === 'JsonObject') && co) 
    const containerType = curObjTypes.find(co => (co.name === 'Container') && co)
    const JsonArrayType = curObjTypes.find(co => (co.name === 'JsonArray') && co)
    const entityType = curObjTypes.find(co => (co.name === 'EntityType') && co)
    const propertyType = curObjTypes.find(co => (co.name === 'Property') && co)
    const hasPartType = curRelTypes.find(co => (co.name === 'hasPart') && co)
    const hasMemberType = curRelTypes.find(co => (co.name === 'hasMember') && co)
    const hasType = curRelTypes.find(co => (co.name === 'has') && co)
 
    let reltypeRef = hasPartType?.id // default partof relship in JSON structure
    let reltypeName = hasPartType?.name // default partof relship in JSON structure

    let relDescription, relTitle
    let fromobjectId, fromobjectName, toobjectId, toobjectName
    let title, description
    let relId


    const createRel = (relId, typeName, description, title, reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName) => {  
        const rel = (fromobjectId) 
            ?   {
                    id: relId,
                    name: typeName,
                    title: title,
                    typeRef: reltypeRef,
                    cardinality: "",
                    cardinalityFrom: undefined,
                    cardinalityTo: undefined,
                    description: description,
                    fromobjectRef: fromobjectId,
                    nameFrom: fromobjectName,
                    generatedTypeId: "",
                    markedAsDeleted: false,
                    modified: true,
                    relshipkind: "",
                    relshipviews: undefined,
                    toobjectRef: toobjectId,
                    nameTo: toobjectName,
                }  
            :   {}
 
        if (!debug) console.log('77 CreatedRel', fromobjectId, toobjectId, rel );

        (fromobjectId && toobjectId) && dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: rel });

    }

    // console.log('56 :', stringifyEntries(deepEntries(topModel))); 

    const propertyObjects = utils.findObjectsByType(curModel.objects, curObjTypes, 'Property' )
    console.log('52 ', propertyObjects);
    // then find objects a name that includes the text 'ID' 
    const propertyObjectsWithId = propertyObjects.filter(o => o.name.includes('ID'))

    // 
    propertyObjectsWithId.forEach(o => {
        console.log('92 ', o.name, curObjects, curRelships);
        //remove the text ID and find another object with the rest name
        const restName = o.name.replace(/ID/g, '')
        const restObject = utils.findObjectByName(curModel.objects, {}, restName)
        // check if the relationship exists between the objects
        const existRelship = utils.findRelshipByToIdAndType(curRelships, restObject?.id, hasPartType?.id)
        console.log('88 ', existRelship);
        
        // find top level object
        let topLevelObject
        if (restObject) { // if no restObject, skip this relationship
            console.log('99 ', o, curObjects, curRelships);  

            topLevelObject = (o) ? utils.findTopLevelObject(o, 'EntityType', curObjects,  curRelships) : null;
            console.log('101 ', topLevelObject, topLevelObject.id, topLevelObject.name);  
            
            toobjectId = restObject?.id
            toobjectName = restObject?.name
            fromobjectId = topLevelObject?.id
            fromobjectName = topLevelObject?.name
            relId = (existRelship) ? existRelship.id : utils.createGuid();
            reltypeRef = hasPartType?.id
            reltypeName = hasPartType?.name
            description = `${fromobjectName} is part of ${toobjectName}`;
            title = '';
            
            console.log('71 ', relId, reltypeName, description, title, reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName);
            
            (fromobjectId !== toobjectId) && (toobjectId) && (topLevelObject.typeName === 'EntityType') && (restObject.typeName === 'EntityType') &&
                 createRel(relId, reltypeName, relDescription="", relTitle="", reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName)
        }     
            
    });    

}

