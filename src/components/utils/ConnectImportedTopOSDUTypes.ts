// @ts- nocheck

const debug = false
import { Dispatch } from 'redux';
import * as utils from '../../akmm/utilities';
// import ObjectTable from '../table/ObjectTable';

// connect top EntityObjects 
// find objects of type 'property' and with a name that includes the text 'ID' and remove that text and find the EtityType object with the rest name
// then traverse upwords and find the top object with type "EntityType"  
// then add a relship between the two objects i.e. the "rest EntityType" and the top EntityType


export const ConnectImportedTopEntityTypes = async (modelType: string, props: { phData: { metis: { models: any[]; metamodels: any[]; }; }; phFocus: { focusModel: { id: any; }; }; }, dispatch: Dispatch<any>, inclDeprecated: boolean) => {
    const debug = false

    if (debug) console.log('13 ', props);

    const curModel = props.phData.metis.models.find((m: { id: any; }) => m.id === props.phFocus.focusModel.id)
    const curObjects = curModel.objects
    const curRelships = curModel.relships

    if (debug) console.log('23 ', props.phFocus.focusModel, curModel, props.phData.metis.models);

    const curMetamodel = props.phData.metis.metamodels.find((mm: { id: any; }) => mm.id === curModel.metamodelRef)
    const curObjTypes = curMetamodel.objecttypes
    const curRelTypes = curMetamodel.relshiptypes
    const refersTo = curRelTypes.find((co: { name: string; }) => (co.name === 'refersTo') && co)
    const hasType = curRelTypes.find((co: { name: string; }) => (co.name === 'has') && co)
    // const IsType = curRelTypes.find((co: { name: string; }) => (co.name === 'Is') && co)
    const relshipType = curRelTypes.find((cr: { name: string; }) => (cr.name === 'relationshipType') && cr)
    if (debug) console.log('32 ', relshipType.id, relshipType.name, refersTo, hasType)

    let reltypeRef = relshipType?.id // default relship between two top objects
    let relName = relshipType?.name

    if (debug) console.log('37 ConnectImportedTopEntityTypes', reltypeRef, relName)


    let relDescription: string, relTitle: string
    let fromobjectId: any, fromobjectName: any, toobjectId: any, toobjectName: any
    let title: string, description: string
    let relId: any, relshipkind: string

    const createRel = (relId: string, relName: string, description: string, title: string, relshipkind: string, reltypeRef: string, fromobjectId: string, fromobjectName: string, toobjectId: string, toobjectName: string, linkObj: any) => {
        if (debug) console.log('45 ', relId, reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName);
        if (!inclDeprecated && linkObj.description && linkObj.description.includes('DEPRECATED:')) return;
        // check if relship already exists
        const relship = curRelships.find((r: { id: any; }) => r.id === relId) // if exists, skip  
        let relDescription = description || '';
        let strokeColor = '';
        if (linkObj.description && linkObj.description.includes('DEPRECATED:')) {
            relName = relName + 'DEPRECATED:';
            relDescription = relDescription;
            strokeColor = 'red';
        }

        const rel: any = (fromobjectId && toobjectId)
            && {
            id: relId,
            name: relName || '',
            // title: title?.replace(/\s+/g, ''), // ?? remove white spaces
            title: title || '',
            typeRef: reltypeRef,
            cardinality: "",
            // cardinalityFrom: undefined,
            // cardinalityTo: undefined,
            description: relDescription,
            strokeColor: strokeColor,
            fromobjectRef: fromobjectId,
            nameFrom: fromobjectName,
            generatedTypeId: "",
            markedAsDeleted: false,
            modified: false,
            relshipkind: relshipkind,
            // relshipviews: undefined,
            toobjectRef: toobjectId,
            nameTo: toobjectName //(toobjectName.contains('.') ? toobjectName.split(".")[0] : toobjectName),
        }

        if (debug) console.log('81 CreatedRel', fromobjectId, rel.nameFrom, toobjectId, rel.nameTo, rel);
        if (!relship) {
            if (fromobjectId && toobjectId) {
                dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data: rel }); // new relship
                if (debug) console.log('76 CreatedRel', fromobjectId, toobjectId, rel);
                const fromObj = { id: linkObj.id, markedAsDeleted: true }
                dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: fromObj }); // for propLink object set mark as deleted
                // TODO: delete propLink relationship ?
                // } else if (!toobjectId) {
                //     dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: { id: linkObj.id, markedAsDeleted: true } }); // for propLink object set mark as deleted
            }
        } else {
            const fromObj = { id: linkObj.id, markedAsDeleted: true }
            dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: fromObj }); // for propLink object set mark as deleted
        }
        if (debug) console.log('85 CreatedRel', fromobjectId, toobjectId, rel);
    }
    // console.log('56 :', stringifyEntries(deepEntries(topModel))); 
    const proxyObjects = utils.findObjectsByType(curModel.objects, curObjTypes, 'Proxy') // find all Proxy objects, this is temporary objedts representing on end of a relship
    if (debug) console.log('101 :', curModel.objects, proxyObjects);

    const proxies = proxyObjects
    if (debug) console.log('112 ', proxies);

    let topLevelObject: { id: any; name: any; }
    // ID ...... Find RelshipType objects with a name that includes the text 'ID' and and generate a relship between this top oject and the rest object
    const genrelProxys = proxies.forEach((o: { [x: string]: string | string[]; name: string; title: string; id: any; refGroupType: any; referenceObject: any; refVersion: any | undefined; description: string; }) => {
        // use the referenceObject to find the top object
        if (debug) console.log('110 Proxy: ', o.name, o.title, o.id, o);
        if (debug) console.log('111 ', o.refGroupType, o.referenceObject, o.refVersion);
        const targetObjectVersion = (o.refVersion === '' || o.refVersion === undefined)
            ? utils.findObjectByNameOnly(curModel.objects, o.referenceObject)
            : utils.findObjectByNameVersion(curModel.objects, o.referenceObject + o.refVersion)
        if (debug) console.log('114 ', targetObjectVersion);
        const targetObject = (targetObjectVersion) ? targetObjectVersion : utils.findObjectByName(curModel.objects, o.referenceObject)
        // const targetObject = utils.findObjectByTitle(curModel.objects, {}, o.referenceObject)
        // const targetObject = (targetObjectVersion) ? targetObjectVersion : utils.findObjectByTitle(curModel.objects, {}, o.referenceObject)
        if (debug) console.log('118 ', targetObject?.name, targetObjectVersion?.name, targetObject, targetObjectVersion);
        if (!targetObject) return; // if no targetObject, skip this relationship

        // find top level object
        if (targetObject) { // targetObject is the OSDUObject that this propLink object refers to
            topLevelObject = (o) ? utils.findTopLevelObject(o, '', curObjects, curRelships) : null; // top level object is the object that the propLink parent
            if (debug) console.log('136 ', o.name, targetObject) //, curObjects, curRelships);  
            if (debug) console.log('137 ', topLevelObject, curObjects, o) //, curObjects, curRelships);  
            if (debug) console.log('139 ', targetObject, o.name, curObjects, topLevelObject);
            fromobjectId = topLevelObject?.id
            fromobjectName = topLevelObject?.name
            const fromtypeRef = curObjects.find((o: { id: any; }) => o.id === fromobjectId)?.typeRef
            const fromrelName = curObjTypes.find((ot: { id: any; }) => ot.id === fromtypeRef)?.name
            relTitle = (o.title) ? o.title : (o.name) ? o.name : "no title"
            relDescription = o.description
            toobjectId = targetObject?.id
            toobjectName = targetObject?.name
            const totypeRef = curObjects.find((o: { id: any; }) => o.id === toobjectId)?.typeRef
            const torelName = curObjTypes.find((ot: { id: any; }) => ot.id === totypeRef)?.name

            let existRelship = utils.findRelshipByFromIdToIdAndType(curRelships, fromobjectId, toobjectId, relshipType?.id) // check if the relationship with is type exists between the objects
            if ((debug)) console.log('139 ', fromobjectId, fromobjectName, toobjectId, toobjectName, existRelship);
            relId = (existRelship) ? existRelship.id : utils.createGuid();
            // relId = (existRelship) ? existRelship.id : utils.createGuid();
            reltypeRef = relshipType?.id //refersTo?.id || hasType?.id
            if (debug) console.log('154 ', relName, fromobjectName, toobjectName);

            if (o.title === 'ColumnStratigraphicHorizonTopID') {
                relName = hasType?.name + 'Top'
                relDescription = `${fromobjectName} has Top ${toobjectName}`;
            } else if (o.title === 'ColumnStratigraphicHorizonBaseID') {
                relName = hasType?.name + 'Base'
                relDescription = `${fromobjectName} has Base ${toobjectName}`;
            }

            if (debug) console.log('164 ', relId, relName, relTitle, reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName);
            if ((debug)) console.log('165 relName: ', relName, 'from: ', fromobjectId, fromobjectName, 'to: ', toobjectId, toobjectName, 'existRelship: ', existRelship);
            if (toobjectId && fromobjectId) {
                if (debug) console.log('166 ', relName, fromrelName, fromobjectName, torelName, toobjectName);
                if (o["$ref"]?.includes('abstract')) {
                    // if (fromrelName === 'Abstract' || torelName === 'Abstract' || torelName === 'ReferenceData') {
                    if (debug) console.log('169 ', fromrelName, fromobjectName, torelName, toobjectName);
                    relName = 'Is'
                    createRel(relId, relName, relDescription, relTitle, relshipkind = 'Generalization', reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName, o)
                } else {
                    if (debug) console.log('173 ConnectImp --- ', relName, relTitle, fromrelName, fromobjectName, torelName, toobjectName);
                    relName = o.title || o.name || 'no title'
                    createRel(relId, relName, relDescription, relTitle, relshipkind = 'Association', reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName, o)
                }
            }
        }
    });

    // 
    // console.log('171 ', genrel); 
    // $ref.......Find RelshipType objects with a $ref attribute and and generate a relship between this top oject and the $ref object
    const proxyObjectsWithRef = proxyObjects.filter((o: { [x: string]: any; }) => o['$ref'])  // find objects with a $ref
    if (debug) console.log('174 ', proxyObjects, proxyObjectsWithRef);

    const genref = proxyObjectsWithRef.forEach((o: { [x: string]: string; id: any; }) => {
        if (debug) console.log('177 ', o['$ref'])//, curObjects, curRelships);
        //remove the the ../abstract and .1.0.0.json and find another object with the rest name

        const lastElement = o['$ref']?.split('/').pop()  // find last element in $ref path
        const firstElement = lastElement?.split('.')[0]   // find what is before the first "."
        const removedAbstract = (firstElement === 'AbstractWorkProductComponent' || 'AbstractCommonResources') ? firstElement : firstElement?.replace('Abstract', '')
        const targetObject = utils.findObjectByName(curModel.objects, removedAbstract)

        if (debug) console.log('185 ', o, firstElement, targetObject);
        // check if the relationship exists between the objects
        const existRelship = utils.findRelshipByToIdAndType(curRelships, targetObject?.id, relshipType?.id) || null

        if (targetObject) { // if no targetObject, skip this relationship

            if (debug) console.log('191 ', o, targetObject, relshipType.id, relshipType.name);
            topLevelObject = (o) ? utils.findTopLevelObject(o, '', curObjects, curRelships) : null;

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

            if (debug) console.log('218 ', fromobjectName, curRelships.find((r: { fromobjectRef: any; }) => r.fromobjectRef === fromobjectId), toobjectId, curRelships.find((r: { toobjectRef: any; }) => r.toobjectRef === toobjectId))
            if (debug) console.log('219 ', fromobjectName, fromType?.id, toobjectName, toType?.id, reltype.name, reltype);
            if (debug) console.log('220 ', curMetamodel);

            // check if a relationship with name = 'Is' already exists between the from and to objects
            // console.log('178 ', fromobjectId, fromobjectName, toobjectId, toobjectName, relId, reltype.id, reltype.name);

            if (curRelships.find((r: { fromobjectRef: any; toobjectRef: any; reltypeRef: any; }) => r.fromobjectRef === fromobjectId && r.toobjectRef === toobjectId && r.reltypeRef === reltype?.id)) {
                // relship exists do nothing
                if (debug) console.log('227 Relship exisit ', fromobjectName, toobjectName, reltype.name);
            } else {
                if (debug) console.log('229 ', fromType?.id, reltype);
                reltypeRef = reltype?.id
                relName = reltype?.name

                let relDescription = `${fromobjectName} Is ${toobjectName}`;
                relTitle = '';


                if (debug) console.log('247 ', relId, relName, 'title:', relTitle, reltypeRef, 'from :', fromobjectId, fromobjectName, 'to :', toobjectId, toobjectName, o.id);
                if (debug) console.log('238 ', relId, relName, 'from : ', fromobjectName, 'to : ', toobjectName);

                // if ((fromobjectId !== toobjectId) && (toobjectId) && (!existRelship)) {
                if (fromobjectId && toobjectId && !existRelship) {
                    createRel(relId, relName, relDescription, relTitle, relshipkind = 'Association', reltypeRef, fromobjectId, fromobjectName, toobjectId, toobjectName, o)
                }
            }

        }

    });

}


