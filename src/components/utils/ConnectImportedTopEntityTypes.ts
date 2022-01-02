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
    const IsType = curRelTypes.find(co => (co.name === 'Is') && co)
 
    let reltypeRef = hasType?.id // default partof relship in JSON structure
    let reltypeName = hasType?.name // default partof relship in JSON structure

    let relDescription, relTitle
    let fromobjectId, fromobjectName, toobjectId, toobjectName
    let title, description
    let relId


    const createRel = (relId, typeName, description, title, reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName) => {  
        console.log('45 ', fromobjectId, fromobjectName, toobjectId, toobjectName);
        
        const rel = (fromobjectId) 
            ?   {
                    id: relId,
                    name: typeName,
                    title: title.replace(/\s+/g, ''),
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
 
        if (!debug) console.log('67 CreatedRel', fromobjectId, toobjectId, rel );

        (fromobjectId && toobjectId) && dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: rel });

    }

    // console.log('56 :', stringifyEntries(deepEntries(topModel))); 

    const relshipTypeObjects = utils.findObjectsByType(curModel.objects, curObjTypes, 'RelshipType' )
    // then find objects a name that includes the text 'ID' 
    const relshipTypeObjectsWithId =  relshipTypeObjects.filter(o => (o.title) && o.title.includes('ID'))
    if (debug) console.log('78 ', relshipTypeObjects, relshipTypeObjectsWithId);

    // Find RelshipType objects with a name that includes the text 'ID' and and generate a relship between this top oject and the rest object
    relshipTypeObjectsWithId.forEach(o => {
        if (debug) console.log('82 ', o.name, curObjects, curRelships);
        //remove the text ID and find another object with the rest name
        const restTitle = o.title.replace(/ID/g, '')  
        const restObject = utils.findObjectByTitle(curModel.objects, {}, restTitle)
        if (debug) console.log('85 ', o, restTitle, restObject);
        // check if the relationship exists between the objects
        const existRelship = utils.findRelshipByToIdAndType(curRelships, restObject?.id, hasType?.id)
        console.log('92 ', restObject && restObject.id, existRelship);
        
        
        // find top level object
        let topLevelObject
        if (restObject) { // if no restObject, skip this relationship

            if (debug) console.log('99 ', o, curObjects, curRelships);  

            topLevelObject = (o) ? utils.findTopLevelObject(o, '', curObjects,  curRelships) : null;
            // topLevelObject = utils.findObjectByTitle(curModel.objects, '', restTitle )
            if (debug) console.log('103 ', topLevelObject);  
            // console.log('98 ', topLevelObject, topLevelObject.id, topLevelObject.name);  
            
            fromobjectId = restObject?.id
            fromobjectName = restObject?.name
            toobjectId = topLevelObject?.id
            toobjectName = topLevelObject?.name
            relId = (existRelship) ? existRelship.id : utils.createGuid();
            reltypeRef = hasType?.id
            reltypeName = hasType?.name
            description = `${fromobjectName} has ${toobjectName}`;
            title = '';
            
            if (debug) console.log('111 ', relId, reltypeName, description, title, reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName);
            
            (fromobjectId !== toobjectId) && (toobjectId) &&
                 createRel(relId, reltypeName, relDescription="", relTitle="", reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName)
        }     
            
    });

    const relshipTypeObjectsWithRef =  relshipTypeObjects.filter(o => o['$ref'] )
    if (debug) console.log('122 ', relshipTypeObjects, relshipTypeObjectsWithRef);

    // Find RelshipType objects with a $ref attribute and and generate a relship between this top oject and the $ref object
    relshipTypeObjectsWithRef.forEach(o => {
        if (debug) console.log('126 ', o['$ref'], curObjects, curRelships);
        //remove the the ../abstract and .1.0.0.json and find another object with the rest name
        // find last element in $ref path
        const lastElement = o['$ref'].split('/').pop() 
        // find the first element in lastElement
        const firstElement = lastElement.split('.')[0]        
        const restObject = utils.findObjectByName(curModel.objects, {}, firstElement)
    
        if (!debug) console.log('134 ', o, firstElement, restObject);
        // check if the relationship exists between the objects
        const existRelship = utils.findRelshipByToIdAndType(curRelships, restObject?.id, hasType?.id)
        // console.log('140 ', restObject.id, existRelship);
        // find top level object
        let topLevelObject
        if (restObject) { // if no restObject, skip this relationship

            if (!debug) console.log('142 ', o, restObject);  

            topLevelObject = (o) ? utils.findTopLevelObject(o, '', curObjects,  curRelships) : null;
            // topLevelObject = utils.findObjectByTitle(curModel.objects, '', restTitle )
            if (!debug) console.log('146 ', topLevelObject);  
            // console.log('98 ', topLevelObject, topLevelObject.id, topLevelObject.name);  
            if (!topLevelObject) console.log('151 ', topLevelObject.name , 'does not exist');
            
            toobjectId = restObject?.id
            toobjectName = restObject?.name
            fromobjectId = topLevelObject?.id
            fromobjectName = topLevelObject?.name
            relId = (existRelship) ? existRelship.id : utils.createGuid();
            reltypeRef = IsType?.id
            reltypeName = IsType?.name
            description = `${fromobjectName} Is ${toobjectName}`;
            title = '';
            
            if (!debug) console.log('159 ', relId, reltypeName, description, title, reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName);
            
            (fromobjectId !== toobjectId) && (toobjectId) &&
                 createRel(relId, reltypeName, relDescription="", relTitle="", reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName)
        }     
            
    });

}

