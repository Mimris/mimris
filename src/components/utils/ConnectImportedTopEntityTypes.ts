// @ts- nocheck

const debug = false
import * as utils from '../../akmm/utilities';
import ObjectTable from '../table/ObjectTable';

// connect top EntityObjects 
// find objects of type 'property' and with a name that includes the text 'ID' and remove that text and find the EtityType object with the rest name
// then traverse upwords and find the top object with type "EntityType"  
// then add a relship between the two objects i.e. the "rest EntityType" and the top EntityType
export const ConnectImportedTopEntityTypes = async (modelType, inclProps, props, dispatch) => {

    // console.log('13 ', props);

    const curModel = props.phData.metis.models.find(m => m.id === props.phFocus.focusModel.id)
    const curObjects = curModel.objects
    const curRelships = curModel.relships

    if (debug) console.log('23 ', props.phFocus.focusModel, curModel, props.phData.metis.models);
    
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
    let relId, relshipkind


    const createRel = (relId, typeName, description, title, relshipkind, reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName, linkId) => {  
        console.log('45 ', fromobjectId, fromobjectName,  toobjectId, toobjectName);

        // check if relship already exists
        const relship = curRelships.find(r => r.id === relId)

        
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
                    relshipkind: relshipkind,
                    relshipviews: undefined,
                    toobjectRef: toobjectId,
                    nameTo: toobjectName,
                }  
            :   {}

        if (debug) console.log('67 CreatedRel', fromobjectId, toobjectId, rel );

        if (!relship) {
            if (fromobjectId && toobjectId) { 
                dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: rel }); // new relship

                const fromObj = {id: linkId, markedAsDeleted: true}
                dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: fromObj }); // for propLink object set mark as deleted
            }
        }
    }

    // console.log('56 :', stringifyEntries(deepEntries(topModel))); 

    const propLinkObjects = utils.findObjectsByType(curModel.objects, curObjTypes, 'PropLink' ) // find all PropLink objects, this is temporary objedts representing on end of a relship
    if (debug) console.log('79 :', curModel, curModel.objects, curObjTypes, propLinkObjects);
    // then find objects a name that includes the text 'ID' 
    const propLinkObjectsWithId =  propLinkObjects.filter(o => o.name?.includes('ID') && o)
    const propLinkObjectsWithSet = propLinkObjects.filter(o => o.name?.includes('Set') && o)
    const propLinkObjectsWithPattern = propLinkObjects.filter(o => o.items?.pattern && o)
    
    const propLinks = [...propLinkObjectsWithId, ...propLinkObjectsWithSet, ...propLinkObjectsWithPattern]
    // const propLinks = (propLinkObjectsWithId.length > 0) ? propLinkObjectsWithId : propLinkObjectsWithSet
    // if (debug) console.log('81 ', propLinkObjects, propLinkObjectsWithId, propLinkObjectsWithSet, propLinks);
    if (debug) console.log('96 ', propLinks);

    // ID ...... Find RelshipType objects with a name that includes the text 'ID' and and generate a relship between this top oject and the rest object
    const genrel = propLinks.forEach(o => {
        // use the linkId to find the top object
       if (debug) console.log('97 ', o.name, o.title, o.id, o.linkId, o);
        if (debug) console.log('115 ', o.linkId);
        const targetObject = utils.findObjectByTitle(curModel.objects, {}, o.linkId)
        if (debug) console.log('106 ', o, o.linkId, targetObject);
        // check if the relationship exists between the objects
        const existRelship = utils.findRelshipByToIdAndType(curRelships, targetObject?.id, hasType?.id)
        if (debug) console.log('109 ', o.name, targetObject && targetObject.id, existRelship);
               
        // find top level object
        let topLevelObject
        if (targetObject) { // if no targetObject, skip this relationship
            topLevelObject = (o) ? utils.findTopLevelObject(o, '', curObjects,  curRelships) : null;
            if (debug) console.log('115 ', o.name, targetObject, topLevelObject) //, curObjects, curRelships);  
            // topLevelObject = utils.findObjectByTitle(curModel.objects, '', restTitle )
            if (debug) console.log('123 ', targetObject, o.name, curObjects, topLevelObject );  
            // if (debug) console.log('98 ', topLevelObject, topLevelObject.id, topLevelObject.name);            
            fromobjectId = topLevelObject?.id
            fromobjectName = topLevelObject?.name 
            toobjectId = targetObject?.id
            toobjectName = targetObject?.name
            relId = (existRelship) ? existRelship.id : utils.createGuid();
            reltypeRef = hasType?.id
            reltypeName = hasType?.name
            description = `${fromobjectName} has ${toobjectName}`;
            title = '';          

            if (debug) console.log('127 ', relId, reltypeName, description, title, reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName);
            if (debug) console.log('127 ', reltypeName,  'from: ', fromobjectName, 'to:', toobjectName);
            if ((fromobjectId !== toobjectId) && (toobjectId) && (!existRelship)) {
                createRel(relId, reltypeName, relDescription="", relTitle="", relshipkind='Associaton', reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName, o.id)
            }
        }          
    });

    const propLinkObjectsWithRef =  propLinkObjects.filter(o => o['$ref'] )  // find objects with a $ref
    if (debug) console.log('142 ', propLinkObjects, propLinkObjectsWithRef);

    // $ref.......Find RelshipType objects with a $ref attribute and and generate a relship between this top oject and the $ref object
    const genref = propLinkObjectsWithRef.forEach(o => {
        if (debug) console.log('146 ', o['$ref'])//, curObjects, curRelships);
        //remove the the ../abstract and .1.0.0.json and find another object with the rest name
        // find last element in $ref path
        const lastElement = o['$ref'].split('/').pop() 
        // find the first element in lastElement
        const firstElement = lastElement.split('.')[0]        
        const targetObject = utils.findObjectByName(curModel.objects, {}, firstElement)
    
        if (debug) console.log('154 ', o, firstElement, targetObject);
        // check if the relationship exists between the objects
        const existRelship = utils.findRelshipByToIdAndType(curRelships, targetObject?.id, IsType?.id) || null
        // const existRelship = utils.findRelshipByFromIdToIdAndType(curRelships, targetObject?.id, hasType?.id)
        // console.log('140 ', targetObject.id, existRelship);
        // find top level object
        let topLevelObject
        if (targetObject) { // if no targetObject, skip this relationship

            if (debug) console.log('162 ', o, targetObject, IsType.id, IsType.name);  

            topLevelObject = (o) ? utils.findTopLevelObject(o, '', curObjects,  curRelships) : null;
            // topLevelObject = utils.findObjectByTitle(curModel.objects, '', restTitle )
            if (debug) console.log('166 ', topLevelObject);  
            // console.log('98 ', topLevelObject, topLevelObject.id, topLevelObject.name);  
            if (!topLevelObject) console.log('171 topLevelObject does not exist');
            
            fromobjectId = topLevelObject?.id
            fromobjectName = topLevelObject?.name
            toobjectId = targetObject?.id
            toobjectName = targetObject?.name
            relId = (existRelship) ? existRelship.id : utils.createGuid(); // use the exist relship id if it exists

            // find the relship type between the from to objects
            const curFromtypeRef = curObjects.find(o => o.id === fromobjectId)?.typeRef
            const curTotypeRef = curObjects.find(o => o.id === toobjectId).typeRef
            if (debug) console.log('174 ', curFromtypeRef, curTotypeRef);

            const fromType = curObjTypes.find(ot => ot.id === curFromtypeRef)
            const toType = curObjTypes.find(ot => ot.id === curTotypeRef)
            if (debug) console.log('175 ', fromType, toType);
            
            // let reltype = curRelTypes.find(rt => ((rt.name === 'Is') && (rt.fromobjtypeRef === fromType.id) && (rt.toobjtypeRef === toType.id)) && rt)
            let reltype = curRelTypes.find(rt => (rt.id === '5718b4c7-3aa1-4ee3-0a9d-5e7cdcd18a24') && rt)

            if (debug) console.log('179 ', fromobjectName, curRelships.find(r => r.fromobjectRef === fromobjectId), toobjectId, curRelships.find(r => r.toobjectRef === toobjectId) )
            if (debug) console.log('185 ', fromobjectName, fromType?.id, toobjectName, toType?.id, reltype.name, reltype);
            if (debug) console.log('186 ', curMetamodel);

            // check if a relationship with name = 'Is' already exists between the from and to objects
            // console.log('178 ', fromobjectId, fromobjectName, toobjectId, toobjectName, relId, reltype.id, reltype.name);

             if (curRelships.find(r => r.fromobjectRef === fromobjectId && r.toobjectRef === toobjectId && r.reltypeRef === reltype?.id)) {
                 // relship exists
             } else {
                console.log('198 ', fromType?.id, reltype);
                reltypeRef = reltype?.id
                reltypeName = reltype?.name

                description = `${fromobjectName} Is ${toobjectName}`;
                title = '';
                
                if (!debug) console.log('202 ', relId, reltypeName, description, title, reltypeRef,'from :', fromobjectId, fromobjectName, 'to :', toobjectId, toobjectName, o.id);
                if (debug) console.log('204 ', relId, reltypeName,'from : ', fromobjectName, 'to : ', toobjectName);
                
                if ((fromobjectId !== toobjectId) && (toobjectId) && (!existRelship)) {
                    createRel(relId, reltypeName, relDescription="", relTitle="", relshipkind='Generalization', reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName, o.id)
                }
             }

        }     
            
    });

}


