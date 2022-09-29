// @ts- nocheck

const debug = false
import { Dispatch } from 'redux';
import * as utils from '../../akmm/utilities';
// import ObjectTable from '../table/ObjectTable';

// connect top EntityObjects 
// find objects of type 'property' and with a name that includes the text 'ID' and remove that text and find the EtityType object with the rest name
// then traverse upwords and find the top object with type "EntityType"  
// then add a relship between the two objects i.e. the "rest EntityType" and the top EntityType
export const ConnectImportedTopEntityTypes = async (modelType: string, inclProps: boolean, props: { phData: { metis: { models: any[]; metamodels: any[]; }; }; phFocus: { focusModel: { id: any; }; }; }, dispatch: Dispatch<any>) => {

    if (debug) console.log('13 ', props);

    const curModel = props.phData.metis.models.find((m: { id: any; }) => m.id === props.phFocus.focusModel.id)
    const curObjects = curModel.objects
    const curRelships = curModel.relships

    if (debug) console.log('23 ', props.phFocus.focusModel, curModel, props.phData.metis.models);
    
    const curMetamodel = props.phData.metis.metamodels.find((mm: { id: any; }) => mm.id === curModel.metamodelRef)
    const curObjTypes = curMetamodel.objecttypes
    const curRelTypes = curMetamodel.relshiptypes

    const JsonObjectType = curObjTypes.find((co: { name: string; }) => (co.name === 'JsonObject') && co) 
    const containerType = curObjTypes.find((co: { name: string; }) => (co.name === 'Container') && co)
    const JsonArrayType = curObjTypes.find((co: { name: string; }) => (co.name === 'JsonArray') && co)
    const entityType = curObjTypes.find((co: { name: string; }) => (co.name === 'EntityType') && co)
    const propertyType = curObjTypes.find((co: { name: string; }) => (co.name === 'Property') && co)
    const hasPartType = curRelTypes.find((co: { name: string; }) => (co.name === 'hasPart') && co)
    const hasMemberType = curRelTypes.find((co: { name: string; }) => (co.name === 'hasMember') && co)
    const refersTo = curRelTypes.find((co: { name: string; }) => (co.name === 'refersTo') && co)
    const hasType = curRelTypes.find((co: { name: string; }) => (co.name === 'has') && co)
    const IsType = curRelTypes.find((co: { name: string; }) => (co.name === 'Is') && co)
 
    let reltypeRef = hasType?.id // default partof relship in JSON structure
    let reltypeName = hasType?.name // default partof relship in JSON structure

    let relDescription: string, relTitle: string
    let fromobjectId: any, fromobjectName: any, toobjectId: any, toobjectName: any
    let title: string, description: string
    let relId: any, relshipkind: string

    const createRel = (relId: any, typeName: any, description: string, title: string, relshipkind: string, reltypeRef: any, fromobjectId: any, fromobjectName: any, toobjectId: any, toobjectName: any, linkID: any) => {  
        if (debug) console.log('45 ', relId, reltypeRef, fromobjectId, fromobjectName,  toobjectId, toobjectName);
        // check if relship already exists
        const relship = curRelships.find((r: { id: any; }) => r.id === relId) // if exists, skip  

        const rel = (fromobjectId) 
            ?   {
                    id: relId,
                    name: typeName,
                    title: title?.replace(/\s+/g, ''),
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
                if (debug) console.log('76 CreatedRel', fromobjectId, toobjectId, rel );
                const fromObj = {id: linkID, markedAsDeleted: true}
                dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: fromObj }); // for propLink object set mark as deleted
                // TODO: delete propLink relationship ?
            } else if (!toobjectId) {
                dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: {id: linkID, markedAsDeleted: true} }); // for propLink object set mark as deleted
            }
        } else {
            const fromObj = {id: linkID, markedAsDeleted: true}
            dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: fromObj }); // for propLink object set mark as deleted
        }
    }

    // console.log('56 :', stringifyEntries(deepEntries(topModel))); 

    const propLinkObjects = utils.findObjectsByType(curModel.objects, curObjTypes, 'PropLink' ) // find all PropLink objects, this is temporary objedts representing on end of a relship
    if (debug) console.log('85 :', curModel.objects, propLinkObjects);
    // then find objects a name that includes the text 'ID' 
    // const propLinkObjectsWithId =  propLinkObjects.filter((o: { name: string | string[]; }) => o.name?.includes('ID') && o)
    // const propLinkObjectsWithType =  propLinkObjects.filter((o: { name: string | string[]; }) => o.name?.includes('Type') && o)
    // const propLinkObjectsWithSet = propLinkObjects.filter((o: { name: string | string[]; }) => o.name?.includes('Set') && o)
    // const propLinkObjectsWithPattern = propLinkObjects.filter((o: { items: { pattern: any; }; }) => o.items?.pattern && o)
    
    // const propLinks = [...propLinkObjectsWithId, ...propLinkObjectsWithType, ...propLinkObjectsWithSet, ...propLinkObjectsWithPattern]
    const propLinks = propLinkObjects
    // const propLinks = (propLinkObjectsWithId.length > 0) ? propLinkObjectsWithId : propLinkObjectsWithSet
    // if (debug) console.log('81 ', propLinkObjects, propLinkObjectsWithId, propLinkObjectsWithSet, propLinks);
    if (debug) console.log('103 ', propLinks);

    let topLevelObject: { id: any; name: any; }
    // ID ...... Find RelshipType objects with a name that includes the text 'ID' and and generate a relship between this top oject and the rest object
    const genrel = propLinks.forEach(o => {
        // use the linkID to find the top object
        if (debug) console.log('109 ', o.name, o.title, o.id, o.linkID, o);
        if (debug) console.log('110 ', o.linkID);
        const targetObject = utils.findObjectByTitle(curModel.objects, {}, o.linkID)
        if (debug) console.log('112 ', o, o.linkID, targetObject);
        // check if the relationship exists between the objects
        let existRelship = utils.findRelshipByToIdAndType(curRelships, targetObject?.id, hasType?.id) // check if the relationship exists between the objects
        existRelship = utils.findRelshipByToIdAndType(curRelships, targetObject?.id, IsType?.id) // check if the relationship with is type exists between the objects
        if (debug) console.log('116 ', o.name, targetObject && targetObject.id, existRelship);
        if (debug) console.log('117 ', o.name);
        
        // find top level object
        if (targetObject) { // if no targetObject, skip this relationship
            topLevelObject = (o) ? utils.findTopLevelObject(o, '', curObjects,  curRelships) : null;
            if (debug) console.log('122 ', o.name, targetObject) //, curObjects, curRelships);  
            if (debug) console.log('123 ', topLevelObject) //, curObjects, curRelships);  
            // topLevelObject = utils.findObjectByTitle(curModel.objects, '', restTitle )
            if (debug) console.log('125 ', targetObject, o.name, curObjects, topLevelObject );  
            // if (debug) console.log('98 ', topLevelObject, topLevelObject.id, topLevelObject.name);            
            fromobjectId = topLevelObject?.id
            fromobjectName = topLevelObject?.name 
            const fromtypeRef = curObjects.find((o: { id: any; }) => o.id === fromobjectId)?.typeRef
            const fromtypeName = curObjTypes.find((ot: { id: any; }) => ot.id === fromtypeRef)?.name
            relTitle = o.title
            relDescription = o.description
            toobjectId = targetObject?.id
            toobjectName = targetObject?.name
            const totypeRef = curObjects.find((o: { id: any; }) => o.id === toobjectId)?.typeRef
            const totypeName = curObjTypes.find((ot: { id: any; }) => ot.id === totypeRef)?.name
      
            relId = (existRelship) ? existRelship.id : utils.createGuid();
            // reltypeRef = refersTo?.id
            reltypeRef = refersTo?.id || hasType?.id
            if (o.title === 'ColumnStratigraphicHorizonTopID') {
                reltypeName = hasType?.name+'Top'
                relDescription = `${fromobjectName} has Top ${toobjectName}`;
            } else if (o.title === 'ColumnStratigraphicHorizonBaseID') {
                reltypeName = hasType?.name+'Base'
                relDescription = `${fromobjectName} has Base ${toobjectName}`;
            } else {
                reltypeName = refersTo?.name || hasType?.name
                relDescription = `${fromobjectName} refersTo ${toobjectName}`;
            }    

            if (debug) console.log('152 ', relId, reltypeName, description, relTitle, reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName);
            if (debug) console.log('153 ', reltypeName,  'from: ', fromobjectName, 'to:', toobjectName);
            if ((toobjectId) && (fromobjectId) && (!existRelship)) {
                if (debug)console.log('155 ', fromtypeRef, fromtypeName, fromobjectName, totypeRef, totypeName, toobjectName);
                if ((fromobjectId) !== (toobjectId)) {
                    if (debug) console.log('157 ', reltypeName, fromtypeName, fromobjectName, totypeName, toobjectName);
                    if (fromtypeName === 'Abstract' || totypeName === 'Abstract') {
                    // if (fromtypeName === 'Abstract' || totypeName === 'Abstract' || totypeName === 'ReferenceData') {
                        if (debug) console.log('160 ', fromtypeName, fromobjectName, totypeName, toobjectName);
                        // do nothing
                    } else {
                        if (debug) console.log('163 ', fromtypeName, fromobjectName, totypeName, toobjectName);
                        createRel(relId, reltypeName, relDescription, relTitle, relshipkind='Associaton', reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName, o.id)
                    }
                }
            }
        }          
    });
    
    // console.log('171 ', genrel); 
    // $ref.......Find RelshipType objects with a $ref attribute and and generate a relship between this top oject and the $ref object
    const propLinkObjectsWithRef =  propLinkObjects.filter((o: { [x: string]: any; }) => o['$ref'] )  // find objects with a $ref
    if (debug) console.log('174 ', propLinkObjects, propLinkObjectsWithRef);

    const genref = propLinkObjectsWithRef.forEach((o: { [x: string]: string; id: any; }) => {
        if (debug) console.log('177 ', o['$ref'])//, curObjects, curRelships);
        //remove the the ../abstract and .1.0.0.json and find another object with the rest name
       
        const lastElement = o['$ref'].split('/').pop()  // find last element in $ref path
        const firstElement = lastElement.split('.')[0]   // find what is before the first "."    
        const removedAbstract = (firstElement === 'AbstractWorkProductComponent') ? firstElement : firstElement.replace('Abstract', '')
        const targetObject = utils.findObjectByName(curModel.objects, {}, removedAbstract)
    
        if (debug) console.log('185 ', o, firstElement, targetObject);
        // check if the relationship exists between the objects
        const existRelship = utils.findRelshipByToIdAndType(curRelships, targetObject?.id, IsType?.id) || null

        if (targetObject) { // if no targetObject, skip this relationship

            if (debug) console.log('191 ', o, targetObject, IsType.id, IsType.name);  
            topLevelObject = (o) ? utils.findTopLevelObject(o, '', curObjects,  curRelships) : null;

            if (debug) console.log('194 ', topLevelObject.name, targetObject.name);  
            // console.log('98 ', topDataObject, topLevelObject.id, topLevelObject.name);  
            if (!topLevelObject) console.log('171 topLevelObject does not exist');
            if (debug) console.log('197 ', o, topLevelObject, targetObject.name);

            fromobjectId = topLevelObject?.id
            fromobjectName = topLevelObject?.name

            toobjectId = targetObject?.id
            toobjectName = targetObject?.name
            relId = (existRelship) ? existRelship.id : utils.createGuid(); // use the exist relship id if it exists

            // find the relship type between the from to objects
            const curFromtypeRef = curObjects.find((o: { id: any; }) => o.id === fromobjectId)?.typeRef
            const curTotypeRef = curObjects.find((o: { id: any; }) => o.id === toobjectId).typeRef
            if (debug) console.log('209 ', curFromtypeRef, curTotypeRef);

            const fromType = curObjTypes.find((ot: { id: any; }) => ot.id === curFromtypeRef)
            const toType = curObjTypes.find((ot: { id: any; }) => ot.id === curTotypeRef)
            if (debug) console.log('213 ', fromType, toType);
            
            // let reltype = curRelTypes.find(rt => ((rt.name === 'Is') && (rt.fromobjtypeRef === fromType.id) && (rt.toobjtypeRef === toType.id)) && rt)
            let reltype = curRelTypes.find((rt: { id: string; }) => (rt.id === '5718b4c7-3aa1-4ee3-0a9d-5e7cdcd18a24') && rt)

            if (debug) console.log('218 ', fromobjectName, curRelships.find((r: { fromobjectRef: any; }) => r.fromobjectRef === fromobjectId), toobjectId, curRelships.find((r: { toobjectRef: any; }) => r.toobjectRef === toobjectId) )
            if (debug) console.log('219 ', fromobjectName, fromType?.id, toobjectName, toType?.id, reltype.name, reltype);
            if (debug) console.log('220 ', curMetamodel);

            // check if a relationship with name = 'Is' already exists between the from and to objects
            // console.log('178 ', fromobjectId, fromobjectName, toobjectId, toobjectName, relId, reltype.id, reltype.name);

             if (curRelships.find((r: { fromobjectRef: any; toobjectRef: any; reltypeRef: any; }) => r.fromobjectRef === fromobjectId && r.toobjectRef === toobjectId && r.reltypeRef === reltype?.id)) {
                 // relship exists do nothing
                 console.log('227 Relship exisit ', fromobjectName, toobjectName, reltype.name);
             } else {
                if (debug) console.log('229 ', fromType?.id, reltype);
                reltypeRef = reltype?.id
                reltypeName = reltype?.name

                let relDescription = `${fromobjectName} Is ${toobjectName}`;
                relTitle = '';
             
                
                if (debug) console.log('237 ', relId, reltypeName, description, 'title:', relTitle, reltypeRef,'from :', fromobjectId, fromobjectName, 'to :', toobjectId, toobjectName, o.id);
                if (debug) console.log('238 ', relId, reltypeName,'from : ', fromobjectName, 'to : ', toobjectName);
                
                if ((fromobjectId !== toobjectId) && (toobjectId) && (!existRelship)) {
                    createRel(relId, reltypeName, relDescription, relTitle, relshipkind='Generalization', reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName, o.id)
                }
             }

        }     
            
    });

}


