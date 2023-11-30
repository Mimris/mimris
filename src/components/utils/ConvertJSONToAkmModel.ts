// @ts-nocheck

import * as utils from "../../akmm/utilities";
import camelCase from "camelcase";
import { ConnectImportedTopEntityTypes } from "./ConnectImportedTopEntityTypes";
import { Dispatch } from "redux";
import { cxValue } from "../../akmm/metamodeller";
import { type } from "os";
import { set } from "immer/dist/internal";
import { setColorsTopEntityTypes } from "./SetColorsTopEntityTypes";
// import ObjectTable from '../table/ObjectTable';
// import { FaAudioDescription } from 'react-icons/fa';

const debug = false;
// read json file and convert OSDU Json format to AKM model
export const ReadConvertJSONFromFileToAkm = async (
    modelType: string,
    inclProps: boolean,
    inclPropLinks: boolean,
    inclAbstractPropLinks: boolean,
    inclGeneric: boolean,
    props: {
        phData: { metis: { models: any[]; metamodels: any[] } };
        phFocus: { focusModel: { id: any } };
        ph: {
            phData: { metis: { models: any[]; metamodels: any[] } };
            phFocus: { focusModel: { id: string } };
        };
    },
    dispatch: Dispatch<any>,
    jsonFile: string
) => {
    // console.log('11', jsonFile)

    // export const ReadConvertJSONFromFileToAkm = async (modelType, inclProps, props, dispatch, e) => {
    //     e.preventDefault()
    //     const files = e.target.files
    //     console.log('13 ', files, e)
    //     const reader = new FileReader()

    const curModel = props.phData?.metis.models.find((m: { id: any }) => m.id === props.phFocus.focusModel.id);
    if (!curModel) return;
    const objects = curModel?.objects;
    if (debug) console.log("14 ", props.phFocus.focusModel, curModel, props.phData.metis.models);

    const curMetamodel = props.phData.metis.metamodels.find((mm: { id: any }) => mm.id === curModel.metamodelRef);
    const curObjTypes = curMetamodel.objecttypes;
    const curRelTypes = curMetamodel.relshiptypes;

    const JsonObjectType = curObjTypes.find((co: { name: string }) => co.name === "JsonObject" && co);

    const entityType = curObjTypes.find((co: { name: string }) => co.name === "EntityType" && co);
    const hasPartType = curRelTypes.find((co: { name: string }) => co.name === "hasPart" && co);
    // const hasMemberType = curRelTypes.find(co => (co.name === 'hasMember') && co)
    const containsType = curRelTypes.find((co: { name: string }) => co.name === "contains" && co);
    const hasType = curRelTypes.find((co: { name: string }) => co.name === "has" && co);
    // console.log('38', hasPartType);
    let objecttypeRef = JsonObjectType?.id; // default partof relship in JSON structure
    let reltypeRef = hasPartType?.id; // default partof relship in JSON structure
    let reltypeName = hasPartType?.name; // default partof relship in JSON structure
    const IsType = curRelTypes.find((co: { name: string }) => co.name === "Is" && co);
    let relshipKind = "Association";
    let osduType = "";

    const createObject = (
        oId: any,
        oName: string,
        otypeRef: string,
        oKey: string,
        osduType: string,
        jsonType = "object",
        oValProps: {}
    ) => {
        // console.log(' 44 createObject', oName, existObj);
        if (debug) console.log("47 createObject", oName, oValProps, modelType);
        // let typeColor: string = 'green'
        let typeColor: string = setColorsTopEntityTypes(osduType);
        let typeTextColor: string = "black";
        let typeStrokeColor: string = "gray";
        let typeIcon: string = `images/model/${oName}.jpeg`;
        let typeImage: string = `images/model/${oName}.jpeg`;
        let typeShape: string = "default";
        let typeSize: string = "default";
        let typeWidth: string = "default";
        let typeHeight: string = "default";
        let typeFont: string = "default";


        if (!debug && osduType === "Masterdata") console.log("53 createObject", oName, oValProps, osduType, typeColor);

        const importedObject =

        
            modelType === "AKM" // don't include json attributes
                ? {
                      id: oId,
                      name: oName,
                      description: oValProps?.title + ": " + oValProps?.description,
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
                      fillcolor: typeColor,
                      textcolor: typeTextColor,
                      strokecolor: typeStrokeColor,
                      icon: typeIcon,
                      image: typeImage,
                      ...oValProps, // additional attributes
                  }
                : {
                      id: oId,
                      name: oName,
                      description: oValProps?.description,
                      // typeName: type,
                      typeRef: otypeRef,
                      abstract: false,
                      markedAsDeleted: false,
                      modified: true,
                      externalID: oKey,
                      osduId: oKey,
                      jsonType: jsonType,
                      jsonKey: oName,
                      ...oValProps, // // additional attributes
                  };

        if (debug) console.log("82 Create object: ", importedObject.name, importedObject);
        dispatch({ type: "UPDATE_OBJECT_PROPERTIES", data: importedObject });

        return importedObject;
    };

    const createRel = (
        relId: string,
        typeName: any,
        description: string,
        title: string,
        reltypeRef: any,
        relKind: string,
        fromobjectId: any,
        fromobjectName: any,
        toobjectId: any,
        toobjectName: any
    ) => {
        const importedRel = fromobjectId
            ? {
                  id: relId,
                  name: typeName,
                  title: title.replace(/\s+/g, ""),
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
            : {};

        // entityId = oId // remember entity id to be used in the next iteration of property  sub objectet.

        if (debug)
            console.log("100 Create relship", fromobjectId, fromobjectName, importedRel.name, toobjectId, toobjectName);

        fromobjectId && toobjectId && dispatch({ type: "UPDATE_RELSHIP_PROPERTIES", data: importedRel });
    };

    if (false) {
        // .-.-.-.-.-.-.-.-.-. imported from generated folder in gitlab -.-.-.-.-.-.-.-
        // hardcoded content add ../abstract/AbstractSystemProperties.json to the file
        // if  $id contains master-data or work-product-component or work-product then add the file to the model
        // let newosduSchema =osduSchema
        // if (osduSchema['$id'].includes('master-data') || osduSchema['$id'].includes('work-product-component') || osduSchema['$id'].includes('work-product')) {
        //     if (osduSchema.hasOwnProperty('data')) { // move allOff up to top level and remove data, to make genrerated the same as authoring i osdu
        //         console.log('151 found osduSchema[data], it must be a grenerated not authoring', osduSchema['data'])
        //         // remove data move content to top and remove data from the jsonobject
        //         const allOf = osduSchema['data']['allOf']
        //         const data = osduSchema.data
        //         delete osduSchema.data
        //         newosduSchema = {...osduSchema, ...allOf}
        //     }
        //     const aspObj = JSON.parse(`{ "$ref": "../abstract/AbstractSystemProperties.1.0.0.json" }`) // insert abstractSystemProperties into the jsonobject
        //     // const aspObj = JSON.parse(`{ "$ref": "../abstract/AbstractSystemProperties.1.0.0.json" }`)
        //     if (debug) console.log('155 ', osduSchema, aspObj)
        //     // move allOf to data
        //     // const data = osduSchema.allOf
        //     // newosduSchema.data = data
        //     // remover allOf from newosduSchema
        //     newosduSchema.allOf = [...osduSchema.allOf, aspObj]
        //     console.log('165 ', newosduSchema)
        // }
        // if (debug) console.log('32', newosduSchema, newosduSchema["$id"], newosduSchema["x-osdu-schema-source"] );
        // // if (osduSchema["$id"]) console.log('20',  osduSchema["$id"].split('/').slice(-1)[0]  );
        // const topName = (newosduSchema["$id"]) ? newosduSchema["$id"].split('/').slice(-1)[0] : newosduSchema["x-osdu-schema-source"]
        // const topModel ={[topName]: newosduSchema} // top object is given topName as key
    }

    // const osduSchema = JSON.parse(jsonFile) // importert JSON file
    // if (debug) console.log('121 osduSchema', osduSchema)

    const osduSchema = JSON.parse(jsonFile.toString()); // imported JSON file
    if (debug) console.log("121 osduSchema", osduSchema);

    let parentId = null; //topModel.id || osduSchema["$id"]
    let mainArray = [];
    let entityName: string;

    // if  $id contains master-data or work-product-component or work-product then add the file to the model
    // if (osduSchema['$id']?.includes('master-data') || osduSchema['$id']?.includes('work-product-component') || osduSchema['$id']?.includes('work-product')) {  // removed:  we use all files
    // console.log('141 osduSchema', ('data' in osduSchema) )
    if (debug) console.log("174 osduSchema", osduSchema, osduSchema.data, osduSchema.properties);
    if (debug) console.log("175 osduSchema", osduSchema, osduSchema.hasOwnProperty("data"));
    if (osduSchema.properties?.data !== undefined) {
        // if data is defined in the json file its a generated where all props are in data
        if (osduSchema.hasOwnProperty("properties")) {
            // if json-file has properties on top-level, its a generated schema-file, we skip this system properties, they will be included via the abstractSystemProperties.json file
            delete osduSchema.properties["id"];
            delete osduSchema.properties["kind"];
            delete osduSchema.properties["version"];
            delete osduSchema.properties["acl"];
            delete osduSchema.properties["legal"];
            delete osduSchema.properties["tags"];
            delete osduSchema.properties["createTime"];
            delete osduSchema.properties["createUser"];
            delete osduSchema.properties["modifyTime"];
            delete osduSchema.properties["modifyUser"];
            delete osduSchema.properties["ancestry"];
            delete osduSchema.properties["meta"];
            console.log("190", osduSchema);
        }
        // move content of data to top and then remove the data from the jsonobjecth
        const allOf = osduSchema.properties["data"]["allOf"];
        // osduSchema.properties = {...osduSchema.properties, allOf}
        delete osduSchema.properties;
        if (debug) console.log("196 allOf", allOf);
        // hardcoded content add ../abstract/AbstractSystemProperties.json to the file
        const aspObj = JSON.parse(`{ "$ref": "../abstract/AbstractSystemProperties.1.0.0.json" }`); // insert abstractSystemProperties into the json-object
        osduSchema["allOf"] = [...allOf, aspObj];
        if (debug) console.log("200 ", osduSchema, aspObj);
    }

    console.log("203 osduSchema", osduSchema);
    let newosduSchema = osduSchema;
    const externalID = newosduSchema.id || newosduSchema["$id"];
    newosduSchema.externalID = externalID;
    newosduSchema.name = newosduSchema.id ? newosduSchema.id.split(":").slice(-1)[0] : newosduSchema.title;
    // newosduSchema.id = null // remove id , it will be generated by the uuid function as AKMM id, the osdu id is put in the externalID

    if (debug) console.log("210", newosduSchema, newosduSchema["$id"], newosduSchema["x-osdu-schema-source"]);
    // if (osduSchema["$id"]) console.log('20',  osduSchema["$id"].split('/').slice(-1)[0]  );

    const topName = newosduSchema["$id"]
        ? newosduSchema["$id"].split("/").slice(-1)[0]
        : newosduSchema.id
        ? newosduSchema.id.split(":").slice(-1)[0]
        : null;
    if (debug) console.log("215", topName, newosduSchema);
    // const topName = (newosduSchema["$id"]) ? newosduSchema["$id"].split('/').slice(-1)[0] :  newosduSchema["x-osdu-schema-source"]

    // ------------------ create top object ------------------
    const topModel = { [topName]: newosduSchema }; // top object is given topName as key
    if (debug) console.log("218", topModel);

    // deepEntries take all object-keys and concatinate them in curKey as a path showing all above levels and put them in a new array
    // example: deepEntries
    //    0: (2) ['846aa642-1ae5-4deb-3cbb-cb7f26615838','Well.1.0.0.json',{$id: 'https://schema.osdu.opengroup.org/json/master-data/Well.1.0.0.json', $schema: 'http://json-schema.org/draft-07/schema#', title: 'Well', description: 'The origin of a set of wellbores.', type: 'object', …}
    //    1: (2) ['fc76c04d-0379-4301-b7cd-d68d861d47f6','Well.1.0.0.json|allOf',  .....]
    //    2: (2) ['20200684-f5d4-460b-0f2e-8f4dcaac0441', 'Well.1.0.0.json|allOf|0',  .......]
    // the curKey is put in a array "allKeys" with curKey as first and the object id as second,and the content i.e. an object as third.
    function deepEntries(obj: { [x: number]: any }) {
        // obj is the object to be traversed
        "use-strict";
        var allkeys: any,
            curKey = "",
            len = 0,
            i = -1,
            entryK: number;
        if (debug) console.log("175 deepEntries", obj);
        function formatKeys(entries: string | any[]) {
            entryK = entries.length;
            len += entries.length;
            while (entryK--) entries[entryK][0] = curKey + JSON.stringify(entries[entryK][0]) + "|"; // concatinate curKey with | as divider
            return entries;
        }
        allkeys = formatKeys(Object.entries(obj || {}));
        if (debug) console.log("193 allkeys : ", allkeys);
        allkeys = allkeys.sort(
            (firstItem: { key: number }, secondItem: { key: number }) => firstItem.key < secondItem.key
        );

        if (debug) console.log("196 allkeys sorted: ", allkeys);

        // iterate over all objects allKeys is an array with [key, value] where key is the Json-object-path and value is the object
        // the key is the path to the object in the JSON-file and the value is the object itself
        while (++i !== len)
            // iterate over all objects ToDo: this should be a separate function returning an mainArray including the i.
            if (typeof allkeys[i][1] === "object" && allkeys[i][1] !== null) {
                // It is an Json structure key as with an object
                console.log("-----------------------------------------------------------------------");
                curKey = allkeys[i][0] + "";

                const jsonType = Array.isArray(allkeys[i][1]) ? "isArray" : "isObject";

                Array.prototype.push.apply(allkeys, formatKeys(Object.entries(allkeys[i][1])));
                if (debug) console.log("210 :", i, entryK, len, curKey.slice(0, -1), allkeys[i][1]);

                // make a unique osduId for each object in the JSON-file by concatinating the path to the object with the name its keys
                // clean up the key path by removing the " in "key" first
                const cleanPath = curKey.slice(0, -1).replace(/"/g, ""); // clean key path ; remove "" from curkey to get a clean key string with the path as curKey

                let osduId = cleanPath;
                let newosduId: string;
                let newIdArray = osduId.split("|"); // make an array of all keys in the path

                if (osduId.includes("|definitions")) {
                    // definitions is in OSDU Generated folder and contain the osdu Json structure, so we strip off all above definitions
                    const [, ...rest] = newIdArray;
                    newosduId = rest.join("|");
                } else {
                    newosduId = osduId;
                }

                // split and slice it, pick last element
                // if  (osduId.includes("|definitions|")) osduId = osduId.split('|').slice(-1)[0] // split and slice it, pick last element
                // console.log('60 :', newosduId);

                const oKey = newosduId; // newosduId is the key for the object in the JSON-file if it has definitions key
                // const childKey = cleanChildPathKey.split('|').slice(-1)[0] // objectName ; split and slice it, pick last element
                // const gchildKey =  cleanGchildPathKey.split('|').slice(-1)[0] // objectName ; split and slice it, pick last element
                // const ggchildKey =  cleanGchildPathKey.split('|').slice(-1)[0] // objectName ; split and slice it, pick last element

                const oVal = allkeys[i][1]; // the object
                // if (debug) console.log('194 :', '\n cleanPath: ', cleanPath, '\n oKey: ', oKey, '\n oName : ', oName, '\n oVal: ', oVal, '\n parentKey: ', parentKey, '\n parentId: ', parentId, '\n parentName: ', parentName);
                // let oValProps = filterObject(oVal)// we only want attributes in oValProps (objects are handled in the next iteration)

                // check if the object is already in the phData
                if (debug)
                    console.log(
                        "241 : ",
                        oKey,
                        curModel.objects.find(
                            (o: { name: string }) => o.name === oKey?.split("|")?.slice(-1)[0].split(".")[0] && o
                        )
                    );

                // the osduId is lost so we have to find the object with the name and that has the same parentId as the object we are currently working on
                // const existName = curModel.objects.find((o: { name: string; }) => o.name === oKey?.split('|')?.slice(-1)[0].split('.')[0] && o) // use name as key to find the object in the model
                // const existParent = curModel.objects.find((o: { name: string; }) => o.name === otKey?.split('|')?.slice(-1)[0].split('.')[0] && o) // use name as key to find the object in the model
                // const existFromobject

                const existObj = curModel.objects.find((o: { osduId: any }) => o.osduId === oKey && o);
                const oId = existObj ? existObj.id : utils.createGuid();
                if (debug) console.log("244 : ", existObj, existObj?.id, oId, oKey, oVal);

                mainArray = [...mainArray, [oId, oKey, oVal]]; // we add the oId to the oKey and oVal in the mainArray so we can search for the id by oKey (the total path id)
                if (debug) console.log("249 ", mainArray);
            }
        return mainArray;
    }

    const osduArray = deepEntries(topModel); // find all the objects in the topModel and down the tree
    if (debug) console.log("303 deepEntries", osduArray);

    // ------------------ create objects and relationships ------------------
    // ----------------------------------------------------------------------
    // ----------------------------------------------------------------------
    // ----------------------------------------------------------------------
    // ----------------------------------------------------------------------
    // map through the osduArray and create objects and relationships between the objects
    const osduObjects = osduArray?.map((osduObj, index) => {
        const [oId, oKey, oVal] = osduObj;
        let oName = oKey?.split("|")?.slice(-1)[0]; // objectName ; split and slice it, pick last element, which is the object name
        if (debug) console.log("456 :", oName, oKey, oVal);
        const oValProps = filterObject(oVal); // filter away subobjects, we only want attributes in oValProps (objects are handled in the next iteration)
        const parentName = oKey?.split("|")?.slice(-2, -1)[0]; // parentName ; split and slice it, pick second last element
        const jsonType = Array.isArray(oVal) ? "isArray" : "isObject";
        // ==================== -------------------- ==================== -------------------- ====================

        // first we create the objects ----------------------------------------------------------------------
        if (index === 0) {
            // the first object is the main-object (topObj)
            processTopObject(oId, oName, oKey, oVal, jsonType, osduObj, oValProps);
        } else if (parentName === "properties") {
            // this is property and proplink objects
            if (debug) console.log("395 parent = properties :", oName, oValProps);
            if (oVal["x-osdu-relationship"]) {
                // if the value is a relationship we create a propLink object
                if (debug) console.log("471 ", oName, oVal, oValProps);
                // if  (parentName === 'RigID') return // we skip the RigID, it is handeled in the VerticalMeasurementID object
                processPropertyLinks(oId, oName, oKey, oVal, jsonType, osduObj, oValProps);
            } else if (oVal["x-osdu-indexing"] || oVal.type === "array") {
                // its and array of objects, we use Collection objecttype
                // } else if (oVal.type === 'array') { // if the value is an array we create a collection object
                if (debug) console.log("404 ", oName, oVal, oValProps);
                processArray(oId, oName, oKey, oVal, jsonType, osduObj, oValProps);
            } else if (inclProps && oVal.type === "string" || oVal.type === "number" || oVal === "integer") {
                // || oVal === 'integer' || oVal === 'number' || oVal === 'boolean' || oVal === 'array' || oVal === 'object') { // if the value is a primitive type
                objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Property")?.id;
                if (debug) console.log("408 ",oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps, osduObj);
                createObjectAndRelationships(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps, osduObj, curModel);
                // }
            } else if (inclProps) {
                //
                if (debug) console.log("510 ", oName, oValProps);
                objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Property")?.id;
                createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps); // create Property
                if (debug) console.log("525  array", oId, oName, objecttypeRef, oKey, jsonType, oValProps);
                findOwnerandCreateRelationship(osduObj, curModel);
            } else {
                console.log("536  object not imported", oName);
            }
        } else if (oVal["$ref"] && inclPropLinks && inclAbstractPropLinks) {
            if (debug) console.log("339 $ref ", oName, oValProps);
            const objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "PropLink")?.id;
            const typeRest = oVal["$ref"].split("/").slice(-1)[0];
            oValProps.title = typeRest?.split(".")[0];
            oValProps.linkID =
                typeRest?.split(".")[0] === "AbstractWorkProductComponent"
                    ? typeRest?.split(".")[0]
                    : typeRest?.split(".")[0]?.replace("Abstract", "");
            const entityName = `Is${oValProps.title}`;
            createObject(oId, entityName, objecttypeRef, oKey, osduType, jsonType, oValProps);
            if (debug) console.log("594 $ref", oId, entityName, objecttypeRef, oKey, jsonType, oValProps);
            findOwnerandCreateRelationship(osduObj, curModel);
        } else if (oName === "items") {
            if (debug) console.log("387 items  ", oName, oValProps);
            let gchildKeyName: string, gchildKeyNameId: string;
            if (debug) console.log("385  items", parentName.substring(oName.length - 3));
            if (parentName.substring(parentName.length - 3) === "Set") {
                // if the parent ends with Set, it is a collection
                const linkedName = parentName.substring(0, parentName.length - 3);
                createLinkedObject(linkedName, oId, oVal, oKey, osduType, jsonType, oValProps);
            } else if (
                parentName === "Markers" ||
                parentName === "Intervals" ||
                parentName === "VerticalMeasurements" ||
                parentName?.includes("IDs")
            ) {
                const oMName = parentName.substring(0, parentName.length - 1);
                createCollectionObject(oMName, oId, oKey, oVal, osduType, jsonType, oValProps);
                if (debug) console.log("391 ConvertJSON...", oMName, oId, oKey, osduType, jsonType, oValProps);
            } else if (oVal.allOf) {
                if (debug) console.log("394  items", oName, oValProps);
                gchildKeyNameId = Object.keys(oVal?.allOf[0]?.properties).find((k) => k.includes("ID"));
                gchildKeyName = gchildKeyName?.replace("ID", "");
                if (gchildKeyName) {
                    createAllOfObject(gchildKeyName, gchildKeyNameId, oId, oKey, oVal, osduType, jsonType, oValProps);
                }
            }
        } else if (inclProps && oName === "required") {
            if (debug) console.log("406 required ", oName, oVal, oValProps);
            const newlist = oVal.map((v) => ({ name: v, required: true }));
            const newCVal = { required: newlist };
            if (debug) console.log("542 required ", oValProps);
            createRequiredObject(oId, oKey, osduType, jsonType, newCVal, osduObj);
        } else if (inclGeneric) {
            // the rest we GenericObjects
            if (debug) console.log("412 rest ", oName, oVal, oValProps);
            objecttypeRef = "5cc540c0-ea91-4401-74bb-4f7cb52a2366"; // we put all the rest as the generic type for now
            if (debug) console.log(  "538 Object not interpreted...",  oId, oName, objecttypeRef, oKey, osduType,jsonType, oValProps );
            createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps); // create the reference objects
            findOwnerandCreateRelationship(osduObj, curModel); // create the relationship between the reference objects and the owner
        }
    });
    // ==================== -------------------- ==================== -------------------- ====================
    // -----------------------------------------------------------------------
    // -----------------------------------------------------------------------
    // -----------------------------------------------------------------------
    // -----------------------------------------------------------------------
    // crate relationships between objects
    // create function findOwnerandCreateRelationship(oId, oKey)
    function findOwnerandCreateRelationship(osObj: [any, any, any], curModel: any) {
        if (!osObj) return;
        if (debug) console.log("551 createRelship ...........", osObj);
        const topObj = mainArray[0];
        const topObjId = topObj[0];
        const topObjKey = topObj[1];
        const topObjName = topObj[1].split(".").slice(-1)[0];
        if (debug) console.log("556 topObjName", topObjName, topObjKey, topObj);
        // const osduObj = curModel.objects.find(o => o.osduId === topObjKey)

        const [oId, oKey, oVal] = osObj;
        const oName = oKey?.split("|")?.slice(-1)[0]; // objectName ; split and slice it, pick last element
        const parentName = oKey?.split("|")?.slice(-2, -1)[0]; // parentName ; split and slice it, pick second last element
        const gparentName = oKey?.split("|")?.slice(-3, -2)[0]; // grandparentName ; split and slice it, pick third last element
        const ggparentName = oKey?.split("|")?.slice(-4, -3)[0]; // grandgrandparentName ; split and slice it, pick fourth last element
        const gggparentName = oKey?.split("|")?.slice(-5, -4)[0]; // grandgrandgrandparentName ; split and slice it, pick fifth last element
        const ggggparentName = oKey?.split("|")?.slice(-6, -5)[0]; // grandgrandgrandgrandparentName ; split and slice it, pick sixth last element
        const gggggparentName = oKey?.split("|")?.slice(-7, -6)[0]; // grandgrandgrandgrandgrandparentName ; split and slice it, pick seventh last element

        const parentKey = oKey.split("|").slice(0, -1).join("|"); // find parent key by splitting the oKey and remove the last element
        const gparentKey = oKey.split("|").slice(0, -2).join("|"); // find grandparent key by splitting the oKey and remove the last two elements
        const ggparentKey = oKey.split("|").slice(0, -3).join("|"); // find greatgrandparent key by splitting the oKey and remove the last three elements
        const gggparentKey = oKey.split("|").slice(0, -4).join("|"); // find greatgreatgrandparent key by splitting the oKey and remove the last four elements
        const ggggparentKey = oKey.split("|").slice(0, -5).join("|"); // find greatgreatgreatgrandparent key by splitting the oKey and remove the last five elements
        const gggggparentKey = oKey.split("|").slice(0, -6).join("|"); // find greatgreatgreatgreatgr andparent key by splitting the oKey and remove the last six elements

        const existRel = curModel?.relationships?.find((r: { fromobjectRef: any }) => r.fromobjectRef === oKey && r);
        const relId = (existRel) ? existRel : utils.createGuid();
        const relDescription = "";
        const relTitle = "";
        reltypeRef = hasType?.id;
        reltypeName = hasType?.name;
        relshipKind = "Association";

        if (debug) console.log("582 parentName", gggparentName, ggparentName, gparentName, parentName);

        if (debug) console.log("461 relship  ", osObj, oName, oKey, oVal);
        // if (debug) console.log('584 relship  ', oName, parentName, gparentName, ggparentName, gggparentName, ggggparentName, gggggparentName, oKey, oVal);
        if (parentName === "properties") {
            // if the parent is properties, we have to find owner and create a relationship between the object and the owner object
            if (debug) console.log("464 ", oName, parentName, gparentName, ggparentName, oKey);
            if (gparentKey === topObjKey) {
                // if granparent is the top object, it is the owner
                const fromobjectId = topObjId;
                const fromobjectName = topObjName;
                const toobjectId = oId;
                const toobjectName = oName;
                if (debug)
                    console.log(
                        "470 ---------",
                        fromobjectName,
                        reltypeName,
                        toobjectName,
                        fromobjectId,
                        toobjectId,
                        oVal
                    );
                // (fromobjectId !== toobjectId) &&
                if (fromobjectId && toobjectId)
                    createRel(
                        relId,
                        reltypeName,
                        relDescription,
                        relTitle,
                        reltypeRef,
                        relshipKind,
                        fromobjectId,
                        fromobjectName,
                        toobjectId,
                        toobjectName
                    );
            } else if (gggparentKey === topObjKey) {
                // if gggparentKey is the same as topObjKey, we use the topObj as owner
                // console.log('475', gggparentKey, parentName,  topObjKey );
                const fromobjectId = topObjId;
                const fromobjectName = topObjName;
                const toobjectId = oId;
                const toobjectName = oName;
                if (debug)
                    console.log("480 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                // (fromobjectId !== toobjectId) &&
                if (fromobjectId && toobjectId)
                    createRel(
                        relId,
                        reltypeName,
                        relDescription,
                        relTitle,
                        reltypeRef,
                        relshipKind,
                        fromobjectId,
                        fromobjectName,
                        toobjectId,
                        toobjectName
                    );
            } else if (gparentName === "items") {
                // && ggparentName === 'Markers') { // if the greatgrandparent is items, we have to find owner and create a relationship between the object and the owner object
                const ownerObj = osduArray.find((o) => o[1] === gparentKey);
                const fromobjectId = ownerObj[0];
                const fromobjectName = ownerObj[1].split("|").slice(-1)[0];
                const toobjectId = oId;
                const toobjectName = oName;
                if (debug)
                    console.log("489 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                if (fromobjectId && toobjectId)
                    createRel(
                        relId,
                        reltypeName,
                        relDescription,
                        relTitle,
                        reltypeRef,
                        relshipKind,
                        fromobjectId,
                        fromobjectName,
                        toobjectId,
                        toobjectName
                    );
            } else if (gparentName === "items" || ggparentName === "properties") {
                //  ???????? ????? ????? if the gparent is items, we have to find owner
                let ownerObj: string[], fromobjectId: string, fromobjectName: string;
                if (ggparentName === "properties") {
                    // if the greatgrandparent is properties, we have to find owner and create a relationship between the object and the owner object
                    ownerObj = osduArray.find((o) => o[1] === parentKey);
                    fromobjectId = ownerObj[0];
                    fromobjectName = ownerObj[1].split("|").slice(-1)[0];
                } else if (ggparentName === "Markers") {
                    // if the greatgrandparent is Markers, we have to create a relationship between the object and the top object
                    ownerObj = osduArray.find((o) => o[1] === parentKey);
                    fromobjectId = ownerObj[0];
                    fromobjectName = ownerObj[1].substring(0, ownerObj[1].length - 1); // remove the last character plural s to get linkobjectName
                } else {
                    ownerObj = osduArray.find((o) => o[1] === ggparentKey);
                    fromobjectId = ownerObj[0];
                    fromobjectName = ownerObj[1].split("|").slice(-1)[0];
                }
                if (debug) console.log("633", gparentKey, parentName, topObjKey);
                const toobjectId = oId;
                const toobjectName = oName;
                if (debug) console.log("636 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                if (fromobjectId && toobjectId)
                    createRel(
                        relId,
                        reltypeName,
                        relDescription,
                        relTitle,
                        reltypeRef,
                        relshipKind,
                        fromobjectId,
                        fromobjectName,
                        toobjectId,
                        toobjectName
                    );
            } else if (gggparentName === "items") {
                // if the greatgrandparent is items, we have to find owner and create a relationship between the object and the owner object
                if (debug) console.log("512", oName, ggggparentName, parentName, topObjKey);
                // if (oName === 'VerticalMeasurementID' && ggggparentName === 'VerticalMeasurements') {
                //     const ownerObj = osduArray.find(o => o[1] === ggggparentKey)
                //     const fromobjectId = ownerObj[0]
                //     const fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                //     const toobjectId = oId
                //     const toobjectName = oName
                //     console.log('518 ', ggggparentName, gggparentName, parentName, oKey);
                //     if (debug) console.log('519 ---------',oName, fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                //     if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName)
                // } else {
                const ownerObj = osduArray.find((o) => o[1] === ggggparentKey);
                const fromobjectId = ownerObj[0];
                const fromobjectName = ownerObj[1].split("|").slice(-1)[0];
                const toobjectId = oId;
                const toobjectName = oName;
                if (debug) console.log("527 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                if (fromobjectId && toobjectId)
                    createRel(
                        relId,
                        reltypeName,
                        relDescription,
                        relTitle,
                        reltypeRef,
                        relshipKind,
                        fromobjectId,
                        fromobjectName,
                        toobjectId,
                        toobjectName
                    );
                // }
            } else {
                const ownerObj = osduArray.find((o) => o[1] === gparentKey);
                const fromobjectId = ownerObj[0];
                const fromobjectName = ownerObj[1].split("|").slice(-1)[0];
                const toobjectId = oId;
                const toobjectName = oName;
                if (debug)
                    console.log("643 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                if (fromobjectId && toobjectId)
                    createRel(
                        relId,
                        reltypeName,
                        relDescription,
                        relTitle,
                        reltypeRef,
                        relshipKind,
                        fromobjectId,
                        fromobjectName,
                        toobjectId,
                        toobjectName
                    );
            }
        } else if (oVal["$ref"]) {
            // if the object is a reference, we have to find the object and create a relationship between the object and the reference object
            const curtype = osduArray.find((o) => o[1] === oKey)[2]?.type;
            if (debug) console.log("648 ", curtype, parentName, gparentKey, topObjKey, oKey);
            if (parentName === "data") {
                // if parent is the data, it is the owner
                const ownerObj = osduArray.find((o) => o[1] === parentKey);
                const fromobjectId = ownerObj[0];
                const fromobjectName = ownerObj[1].split("|").slice(-1)[0];
                const toobjectId = oId;
                const toobjectName = oName;
                if (debug)
                    console.log("476 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                if (fromobjectId && toobjectId)
                    createRel(
                        relId,
                        reltypeName,
                        relDescription,
                        relTitle,
                        reltypeRef,
                        relshipKind,
                        fromobjectId,
                        fromobjectName,
                        toobjectId,
                        toobjectName
                    );
            } else if (gparentKey === topObjKey) {
                // if granparent is the top object, it is the owner
                const ownerObj = osduArray.find((o) => o[1] === gparentKey);
                const fromobjectId = ownerObj[0];
                const fromobjectName = ownerObj[1].split("|").slice(-1)[0];
                const toobjectId = oId;
                const toobjectName = oName;
                if (debug)
                    console.log("663 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                if (fromobjectId && toobjectId)
                    createRel(
                        relId,
                        reltypeName,
                        relDescription,
                        relTitle,
                        reltypeRef,
                        relshipKind,
                        fromobjectId,
                        fromobjectName,
                        toobjectId,
                        toobjectName
                    );
                // if parent type is undefined or null, the owner is the grandparent
            } else if (!curtype) {
                const ownerObj = osduArray.find((o) => o[1] === parentKey);
                const fromobjectId = ownerObj[0];
                const fromobjectName = ownerObj[1].split("|").slice(-1)[0];
                const toobjectId = oId;
                const toobjectName = oName;
                if (debug)
                    console.log("672 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                if (fromobjectId && toobjectId)
                    createRel(
                        relId,
                        reltypeName,
                        relDescription,
                        relTitle,
                        reltypeRef,
                        relshipKind,
                        fromobjectId,
                        fromobjectName,
                        toobjectId,
                        toobjectName
                    );
            } else {
                //
                const ownerObj = osduArray.find((o) => o[1] === gparentKey);
                const fromobjectId = ownerObj[0];
                const fromobjectName = ownerObj[1].split("|").slice(-1)[0];
                const toobjectId = oId;
                const toobjectName = oName;
                if (debug)
                    console.log("496 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                if (fromobjectId && toobjectId)
                    createRel(
                        relId,
                        reltypeName,
                        relDescription,
                        relTitle,
                        reltypeRef,
                        relshipKind,
                        fromobjectId,
                        fromobjectName,
                        toobjectId,
                        toobjectName
                    );
            }
        } else if (oName === "items") {
            // if the greatgrandparent is items, we have to find owner and create a relationship between the object and the owner object
            const ownerObj = osduArray.find((o) => o[1] === parentKey);
            const fromobjectId = ownerObj[0];
            const fromobjectName = ownerObj[1].split("|").slice(-1)[0];
            const toobjectId = oId;
            const toobjectName = oName;
            if (debug)
                console.log("689 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
            if (fromobjectId && toobjectId)
                createRel(
                    relId,
                    reltypeName,
                    relDescription,
                    relTitle,
                    reltypeRef,
                    relshipKind,
                    fromobjectId,
                    fromobjectName,
                    toobjectId,
                    toobjectName
                );
        } else if (oName === "required") {
            // if the greatgrandparent is required, we have to find owner and create a relationship between the object and the owner object
            const ownerObj = osduArray.find((o) => o[1] === parentKey);
            const fromobjectId = ownerObj[0];
            const fromobjectName = ownerObj[1].split("|").slice(-1)[0];
            const toobjectId = oId;
            const toobjectName = oName;
            if (debug)
                console.log("703 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
            if (fromobjectId && toobjectId)
                createRel(
                    relId,
                    reltypeName,
                    relDescription,
                    relTitle,
                    reltypeRef,
                    relshipKind,
                    fromobjectId,
                    fromobjectName,
                    toobjectId,
                    toobjectName
                );
        }
    }

    // ConnectImportedTopEntityTypes("JSON", inclProps, props, dispatch)  // this will be run as a separate command
    // filter to get only attributes (objects removed)
    function filterObject(obj: { [x: string]: any; hasOwnProperty: (arg0: string) => any }) {
        let newobj = {};
        for (var i in obj) {
            if (!obj.hasOwnProperty(i)) continue;
            if (typeof obj[i] == "object") continue;
            const tmpkey = i;
            // if (i === 'type') tmpkey = 'osduType' // type is a akmm attribute probably not the same as osdu attribute
            if (i === "name") continue; // name is set in the createObject function
            newobj = {
                ...newobj,
                [tmpkey]: obj[i],
            };
            if (debug) console.log("130", i, obj[i], newobj);
        }
        if (debug) console.log("513 :", obj, newobj);

        return newobj;
    }

    function process(key: any, value: any) {
        //called with every property and its value
        // if (key === "id") key = "$id"  // We will use our own uuid so rename if source has id
        // if (key === 'name' && (!value))  key = "contryName"
        const attribute = { [key]: value };
        return attribute;
    }

    function createObjectAndRelationships(
        oId: string,
        oName: string,
        objecttypeRef: string,
        oKey: string,
        osduType: string,
        jsonType: string,
        oValProps: any,
        osduObj: any,
        curModel: any
    ) {
        if (debug) console.log("625 createObjectAndRelship", oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps);
        createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps);
        findOwnerandCreateRelationship(osduObj, curModel);
    }

    function processTopObject(
        oId: string,
        oName: string,
        oKey: string,
        oVal: any,
        jsonType: string,
        osduObj: an,
        oValProps: any
    ) {
        if (debug) console.log("320 topObjName", oName, oKey, oVal);
        let topObjName = oName.split(".")[0];
        console.log("612 topObjName", topObjName);
        const entityPathElement = oVal.$id ? oVal.$id.split("/").slice(-2)[0] : "";
        const osduType = camelCase(entityPathElement, { pascalCase: true });
        if (osduType === "Abstract") {
            oValProps.abstract = true;
        }
        objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "EntityType")?.id;
        if (topObjName.includes("Abstract")) {
            if (topObjName !== "AbstractWorkProductComponent") {
                topObjName = topObjName.replace("Abstract", "");
                oValProps.abstract = true;
            }
        }
        createObject(oId, topObjName, objecttypeRef, oKey, osduType, jsonType, oValProps);
        console.log("345 topObject", topObjName, oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps);
    }

    function processEntityType(
        oId: string,
        oName: string,
        oKey: string,
        oVal: any,
        jsonType: string,
        osduObj: any,
        oValProps: any
    ) {
        if (debug) console.log("623 parent = properties :", oName, oVal, oValProps);
        // if (oVal['x-osdu-indexing']) {
        let entityName = oName;
        objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "EntityType")?.id;
        createObject(oId, entityName, objecttypeRef, oKey, osduType, jsonType, oValProps);
        findOwnerandCreateRelationship(osduObj);
        // }
    }

    function processPropertyLinks(
        oId: string,
        oName: string,
        oKey: any,
        oVal: any,
        jsonType: string,
        osduObj: any,
        oValProps: any
    ) {
        if (debug) console.log("343 parent = properties :", oName, oVal);
        if (inclPropLinks && oVal["x-osdu-relationship"]) {
            oVal["x-osdu-relationship"].forEach((rel: { type: string }) => {
                objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "PropLink")?.id;
                if (debug) console.log("348  relationship", rel, objecttypeRef);
                // if (oName.includes('IDs') || oName.includes('ID')) {
                //     oValProps.linkID = oName.replace(/IDs|ID/g, '');
                // } else {
                //     oValProps.linkID = oName;
                // }

                if (rel.EntityType) oValProps.linkID = rel.EntityType;
                if (rel.GroupType) oValProps.groupType = rel.GroupType;
                // Todo: check if this is needed It may be that rel.EntityType covers all cases??????
                switch (oValProps.linkID) {
                    case "Company":
                    case "Owner":
                    case "ServiceCompany":
                        oValProps.linkID = "Organisation";
                        break;
                    case "ParentProject":
                        oValProps.linkID = "Project";
                        break;
                    case "StationPropertyUnit":
                        oValProps.linkID = "UnitOfMeasure";
                        break;
                    case "TrajectoryStationPropertyType":
                        oValProps.linkID = "TrajectoryStationPropertyType";
                        break;
                    case "SurveyToolType":
                        oValProps.linkID = "SurveyToolType";
                        break;
                    case "Target":
                        oValProps.linkID = "GeometricTargetSet";
                        break;
                    case "GeographicCRS":
                        oValProps.linkID = "CoordinateReferenceSystem";
                        break;
                    case "ProjectedCRS":
                        oValProps.linkID = "CoordinateReferenceSystem";
                        break;
                    case "Feature":
                        oValProps.linkID = "LocalRockVolumeFeature";
                        break;
                    case "ColumnStratigraphicHorizonTop":
                    case "ColumnStratigraphicHorizonBase":
                        oValProps.linkID = "HorizonInterpretation";
                        break;
                    case "Interpretation":
                        oValProps.linkID = "HorizonInterpretation";
                        break;
                    case "RockVolumeFeature":
                        oValProps.linkID = "RockVolumeFeature";
                        break;
                    case "MarkerPropertyUnit":
                        oValProps.linkID = "UnitOfMeasure";
                        break;
                    case "WellLogType":
                        oValProps.linkID = "LogType";
                        break;
                    case "SamplingDomainType":
                        oValProps.linkID = "WellLogSamplingDomainType";
                        break;
                    case "StartMarkerSet":
                    case "StopMarkerSet":
                        oValProps.linkID = "WellboreMarkerSet";
                        break;
                    case "StartMarker":
                    case "StopMarker":
                        oValProps.linkID = "Marker";
                        break;
                    case "StartBoundaryInterpretation":
                    case "StopBoundaryInterpretation":
                        oValProps.linkID = "HorizonInterpretation";
                        break;
                    case "DefaultVerticalMeasurement":
                        oValProps.linkID = "VerticalMeasurement";
                        break;
                    case "PrimaryMaterial":
                        oValProps.linkID = "MaterialType";
                        break;
                    case "TargetFormation":
                        oValProps.linkID = "GeologicalFormation";
                        break;
                    case "Condition":
                        oValProps.linkID = "WellCondition";
                        break;
                    case "Fluiddirection":
                        oValProps.linkID = "WellFluidDirection";
                        break;
                    case "KickOffWellbore":
                        oValProps.linkID = "Wellbore";
                        break;

                    // case 'AbstractCommonResources':
                    // oValProps.linkID = 'OSDUCommonResources';
                    // break;
                    default:
                        break;
                }
                const propLinkName = "has" + oName;
                createObject(oId, propLinkName, objecttypeRef, oKey, osduType, jsonType, oValProps);
                if (debug) console.log("386 not ID ", oId, propLinkName, objecttypeRef, oKey, jsonType, oValProps);
                findOwnerandCreateRelationship(osduObj);
            });
        }
    }

    function processArray(
        oId: string,
        oName: string,
        oKey: string,
        oVal: any,
        jsonType: string,
        osduObj: any,
        oValProps: any
    ) {
        if (debug) console.log("717  array Set: ", oId, oName, objecttypeRef, oKey, jsonType, oValProps, oVal);
        if (debug) console.log("718 :", parentName.substring(parentName.length - 3));

        switch (true) {
            case oName.substring(oName.length - 3) === "Set" || oName === "Markers":
                objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Collection")?.id;
                oValProps.viewkind = "container";
                createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps);
                if (debug) console.log("399  array Set", oId, oName, objecttypeRef, oKey, jsonType, oValProps);
                findOwnerandCreateRelationship(osduObj);
                break;
            case oName.includes("ID") || oName.includes("IDs"):
                if (oName === "MarkerID" || oName === "IntervalID" || oName === "VerticalMeasurementID") {
                    // do nothing
                } else {
                    if (debug) console.log("402  array", oId, oName, oKey, jsonType, oValProps);
                    objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "PropLink")?.id;
                    let linkID = oName.replace("ID", ""); // remove ID from the name
                    const propLinkName = "has" + oName;
                    oValProps.linkID = oName;
                    if (debug) console.log("407  array", oName, linkID, oValProps);
                    createObject(oId, propLinkName, objecttypeRef, oKey, osduType, jsonType, oValProps);
                    if (debug)
                        console.log("409  array ID", oId, propLinkName, objecttypeRef, oKey, jsonType, oValProps);
                    findOwnerandCreateRelationship(osduObj);
                }
                break;
            case oValProps["$ref"]:
                objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Collection")?.id;
                createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps);
                if (debug) console.log("747  array $ref", oId, oName, objecttypeRef, oKey, jsonType, oValProps);
                findOwnerandCreateRelationship(osduObj);
                break;
            default:
                if (debug) console.log("418  array", oId, oName, oKey, jsonType);
                objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Collection")?.id;
                if (oName === "Markers") oName = oName.substring(0, oName.length - 1); // remove the last character from the name
                createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps);
                if (debug) console.log("425  array else", oId, oName, objecttypeRef, oKey, jsonType, oValProps);
                findOwnerandCreateRelationship(osduObj);
                break;
        }
    }

    function processPrimitiveType(
        oId: string,
        oName: string,
        oKey: string,
        oVal: any,
        jsonType: string,
        osduObj: any,
        oValProps: any
    ) {
        if (debug) console.log("429  primitive", oId, oName, oKey, jsonType, oValProps);
        if (oName.includes("IDs") || oName.includes("ID")) {
            const propLinkName = "has" + oName;
            const parentName = oKey?.split("|")?.slice(-2, -1)[0]; // parentName ; split and slice it, pick second last element
            objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "PropLink")?.id;
            oValProps.linkID = oName.replace(/IDs|ID/g, "");
            if (debug) console.log("820 ", oName, oValProps);
            processPropertyLinks(parentName, oName, oVal, jsonType, oValProps, osduObj);
            createObject(oId, propLinkName, objecttypeRef, oKey, osduType, jsonType, oValProps);
            if (debug) console.log("352 ID", oId, propLinkName, objecttypeRef, oKey, jsonType, oValProps);
            findOwnerandCreateRelationship(osduObj);
        } else if (inclPropLinks && oName.substring(oName.length - 4) === "Type") {
            oValProps.linkID = oName;
            const propLinkName = "has" + oName;
            objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "PropLink")?.id;
            createObject(oId, propLinkName, objecttypeRef, oKey, osduType, jsonType, oValProps);
            if (debug) console.log("472 TYPE", oId, propLinkName, objecttypeRef, oKey, jsonType, oValProps);
            findOwnerandCreateRelationship(osduObj);
        } else if (inclPropLinks && oName.substring(0, 8) === "Abstract") {
            oValProps.linkID = oName;
            if (oValProps.linkID === "AbstractCommonResources") {
                oValProps.linkID = "OSDUCommonResources";
            }
            const propLinkName = "has" + oName;
            objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "PropLink")?.id;
            createObject(oId, propLinkName, objecttypeRef, oKey, osduType, jsonType, oValProps);
            if (debug) console.log("472 TYPE", oId, propLinkName, objecttypeRef, oKey, jsonType, oValProps);
            findOwnerandCreateRelationship(osduObj);
        } else if (inclProps) {
            objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Property")?.id;
            createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps);
            if (debug) console.log("477 Property ", oId, oName, objecttypeRef, oKey, jsonType, oValProps);
            findOwnerandCreateRelationship(osduObj);
        }
    }

    function createLinkedObject(
        linkedName: string,
        oId: string,
        oKey: string,
        oVal: any,
        osduType: string,
        jsonType: string,
        oValProps: any,
        osduObj: any
    ) {
        const propLinkName = `has${linkedName}`;
        const objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "PropLink")?.id;
        oValProps.linkID = linkedName;
        createObject(oId, propLinkName, objecttypeRef, oKey, osduType, jsonType, oValProps);
        if (debug) console.log("349 Set", oId, propLinkName, objecttypeRef, oKey, jsonType, oValProps);
        findOwnerandCreateRelationship(osduObj);
    }

    function createCollectionObject(
        oMName: string,
        oId: string,
        oKey: string,
        oVal: any,
        osduType: string,
        jsonType: string,
        oValProps: any,
        osduObj: any
    ) {
        const objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Collection")?.id;
        const reltypeRef = containsType?.id;
        const reltypeName = containsType?.name;
        const relshipKind = "Association";
        createObject(oId, oMName, objecttypeRef, oKey, osduType, jsonType, oValProps);
        if (debug)
            console.log("398 Markers/Intervals=Collections", oId, oMName, objecttypeRef, oKey, jsonType, oValProps);
        findOwnerandCreateRelationship(osduObj);
    }

    function createAllOfObject(
        gchildKeyName: string,
        gchildKeyNameId: string,
        oId: string,
        oKey: string,
        oVal: any,
        osduType: string,
        jsonType: string,
        oValProps: any,
        osduObj: any
    ) {
        const objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "PropLink")?.id;
        const entityName = `Is${gchildKeyName}`;
        oValProps.title = gchildKeyNameId;
        oValProps.linkID = gchildKeyNameId;
        const reltypeRef = containsType?.id;
        const reltypeName = containsType?.name;
        const relshipKind = "Association";
        createObject(oId, entityName, objecttypeRef, oKey, jsonType, oValProps);
        if (debug) console.log("529 allOf", oId, entityName, objecttypeRef, oKey, jsonType, oValProps);
        findOwnerandCreateRelationship(osduObj);
    }

    function createRequiredObject(
        oId: string,
        oKey: string,
        osduType: string,
        jsonType: string,
        oValProps: any,
        osduObj: any
    ) {
        const objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Property")?.id;
        const entityName = "IsRequired";
        createObject(oId, entityName, objecttypeRef, oKey, osduType, jsonType, oValProps);
        if (debug) console.log("539 required", oId, entityName, objecttypeRef, oKey, jsonType, oValProps);
        findOwnerandCreateRelationship(osduObj);
    }

    function extractRegex(inputString, regex) {
        // extract the GroupType and EntityType from the string
        // const regex = /^[\w\-\.]+:(reference-data\-\-WellBusinessIntention):[\w\-\.\:\%]+:[0-9]*$/;
        // const match = inputString.match(regex);
        // Split the string by colon and return the reference-data and WellBusinessIntention parts
        const parts = inputString.split(":");
        const GroupAndType = parts[1].split("--");
        return {
            GroupType: referenceDataAndIntention[0],
            EntityType: referenceDataAndIntention[1],
        };
    }

    // Example usage
    // const input = "user-name:reference-data--WellBusinessIntention:some%data:12345";
    // const result = extractReferenceDataAndWellBusinessIntention(input);
    // console.log(result);
    // Output: { referenceData: 'reference-data', wellBusinessIntention: 'WellBusinessIntention' }
};
