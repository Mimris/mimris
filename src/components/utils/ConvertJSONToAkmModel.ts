// @ts-nocheck

import * as utils from "../../akmm/utilities";
import { Dispatch } from "redux";
import { setColorsTopOSDUTypes } from "./SetColorsTopOSDUTypes";

const debug = false;

// read json file and convert OSDU Json format to AKM model
export const ReadConvertJSONFromFileToAkm = async (
    jsonFile: string,
    dispatch: Dispatch<any>,
    props: {
        phData: { metis: { models: any[]; metamodels: any[] } };
        phFocus: { focusModel: { id: any } };
        ph: {
            phData: { metis: { models: any[]; metamodels: any[] } };
            phFocus: { focusModel: { id: string } };
        };
    },
    inclProps: boolean,
    inclPropLinks: boolean,
    inclXOsduProperties: boolean,
    inclAbstractPropLinks: boolean,
    inclArrayProperties: boolean,
    inclGeneric: boolean,
    inclAbstract: boolean,
    inclReference: boolean,
    inclMasterdata: boolean,
    // inclWorkProduct: boolean,
    inclWorkProductComponent: boolean,
    inclDeprecated: boolean,
    modelType: string,
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
    if (debug) console.log("53 ", inclProps, inclPropLinks, inclXOsduProperties, inclAbstractPropLinks, inclArrayProperties, inclGeneric, inclAbstract, inclReference, inclMasterdata, inclWorkProductComponent, modelType, curModel, objects);

    const curMetamodel = props.phData.metis.metamodels.find((mm: { id: any }) => mm.id === curModel.metamodelRef);
    const curObjTypes = curMetamodel.objecttypes;
    const curRelTypes = curMetamodel.relshiptypes;

    const JsonObjectType = curObjTypes.find((co: { name: string }) => co.name === "JsonObject" && co);

    const entityType = curObjTypes.find((co: { name: string }) => co.name === "OSDUType" && co);
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

    // const[proxyGroupType, setPropLinkGroupType] = useState('')

    function lightenColor(color: string, percent: number) {
        // https://css-tricks.com/snippets/javascript/lighten-darken-color/
        var num = parseInt(color?.replace("#", ""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            B = ((num >> 8) & 0x00ff) + amt,
            G = (num & 0x0000ff) + amt;
        return (
            "#" +
            (
                0x1000000 +
                (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
                (B < 255 ? (B < 1 ? 0 : B) : 255) * 0x100 +
                (G < 255 ? (G < 1 ? 0 : G) : 255)
            )
                .toString(16)
                .slice(1)
        );
    }
    // oId, topObjName, objecttypeRef, oKey, osduType, jsonType, oValProps, groupType


    const createObject = (
        oId: any,
        oName: string,
        otypeRef: string,
        oKey: string,
        osduType: string,
        jsonType = "object",
        oValProps: {},
    ) => {


        if ((debug)) console.log("117 createObject", oId, oName, otypeRef, oKey, osduType, jsonType, oValProps, groupType, proxyGroupType, proxyReferenceObject);

        if (!inclDeprecated && oName.includes("DEPRECATED")) return; // skip deprecated
        let typeColor = ''
        let typeColor2 = ''
        if (debug) console.log("92 createObject", oName, osduType, jsonType, groupType, typeColor);
        let typeTextColor: string = "";
        let typeTextColor2: string = "";
        let typeStrokeColor: string = "";
        let typeStrokeColor2: string = "";
        let typeIcon: string = "" //`images/types/${oName}.jpeg`;
        // let typeShape: string = "default";
        // let typeSize: string = "default";
        let typeImage: string = "" //`images/model/${oName}.jpeg`;
        // let typeWidth: string = "default";
        // let typeHeight: string = "default";
        // let typeFont: string = "default";

        // if ((debug) && osduType === "Masterdata") console.log("53 createObject", oName, oValProps, osduType, typeColor);
        // if description contain Deprecated we add Depreciate to the name

        if (oValProps?.description?.includes("DEPRECATED")) {
            oName = oName + " DEPRECATED";
            typeStrokeColor = "red";
        }

        typeColor = (osduType === 'OSDUType')
            ? setColorsTopOSDUTypes(groupType)
            : (osduType === 'Array' || osduType === 'Item')
                ? lightenColor(setColorsTopOSDUTypes(osduType), 6)
                : ''

        typeColor2 = (oValProps.refGroupType !== '')
            ? setColorsTopOSDUTypes(oValProps.refGroupType)
            : ''


        typeStrokeColor2 = (oValProps.refGroupType !== '')
            ? setColorsTopOSDUTypes(oValProps.refGroupType)
            : ''
        if (debug) console.log("156 createObject", oName, osduType, groupType, typeColor);

        // if (proxyGroupType) {
        //     typeColor2 = (osduType === 'OSDUType')
        //     typeStrokeColor2 = proxyGroupType;
        // }

        if ((debug)) console.log('163 createObject', oName, groupType, oValProps.refGroupType, otypeRef, 'typeColor 1', typeColor, '2', typeColor2, 'strokeColor 1', typeStrokeColor, 'strokeColor2', typeStrokeColor2);

        const importedObject = //(modelType === "AKM") // don't include json attributes
        {
            id: oId,
            name: oName,
            // title: oValProps?.title,
            // description: oValProps?.description,
            // typeName: type,
            typeRef: otypeRef,
            abstract: (osduType === "Abstract") ? true : false,
            markedAsDeleted: false,
            modified: false,
            externalID: oKey,
            osduId: oKey,
            osduType: osduType,
            // groupType: groupType,
            // groupType: (osduType) ? groupType : "",
            dataType: oValProps.type,
            referenceObject: oValProps.referenceObject,
            refGroupType: oValProps.refGroupType,
            refVersion: oValProps.refVersion,
            // jsonType: jsonType,
            // jsonKey: oName,˝
            // (groupType === 'OSDUType') ? typeColor : (groupType === 'Array') && lightenColor(typeColor, 20),
            fillcolor: typeColor,
            fillcolor2: typeColor2,
            textcolor: typeTextColor,
            textcolor2: typeTextColor2,
            strokecolor: typeStrokeColor,
            strokecolor2: typeStrokeColor2,
            icon: typeIcon,
            image: typeImage,
            ...oValProps, // additional attributes
        }

        if (debug) console.log("188 Create object: ", importedObject);
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

        let typeTextColor: string = "gray";
        let typeStrokeColor: string = "gray";

        const importedRel = (fromobjectId) &&
        {
            id: relId,
            name: typeName,
            title: title.replace(/\s+/g, ""), // remove all white spaces
            cardinality: "",
            // cardinalityFrom: undefined,
            // cardinalityTo: undefined,
            description: description,
            fromobjectRef: fromobjectId,
            nameFrom: fromobjectName,
            generatedTypeId: "",
            // id: parentKey+oKey,
            markedAsDeleted: false,
            modified: false,
            relshipkind: relKind,
            // relshipviews: undefined,
            toobjectRef: toobjectId,
            nameTo: toobjectName,
            typeRef: reltypeRef,
            textcolor: typeTextColor,
            strokecolor: typeStrokeColor,
        }
        // entityId = oId // remember entity id to be used in the next iteration of property  sub objectet.
        if (debug) console.log("160 Create relship", fromobjectId, fromobjectName, importedRel, toobjectId, toobjectName);
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
    if (debug) console.log("277 osduSchema", osduSchema);

    let parentId = null; //topModel.id || osduSchema["$id"]
    let mainArray = [];
    let entityName: string;
    let groupType: string;

    // if  $id contains master-data or work-product-component or work-product then add the file to the model
    // if (osduSchema['$id']?.includes('master-data') || osduSchema['$id']?.includes('work-product-component') || osduSchema['$id']?.includes('work-product')) {  // removed:  we use all files
    // console.log('141 osduSchema', ('data' in osduSchema) )
    if (debug) console.log("174 osduSchema", osduSchema, osduSchema.data, osduSchema.properties);
    if (debug) console.log("175 osduSchema", osduSchema, osduSchema.hasOwnProperty("data"));
    if (osduSchema.properties?.data !== undefined) {
        // if data is defined in the json file its a generated where all props are in data
        if (osduSchema.hasOwnProperty("properties")) {
            // if json-file has properties on top-level, its a generated schema-file, we skip this system properties here, they will be included via the abstractSystemProperties.json file
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
            if (debug) console.log("281", osduSchema);
        }
        // move content of data to top and then remove the data from the jsonobject
        const allOf = osduSchema.properties["data"]["allOf"];
        osduSchema.properties = { ...osduSchema.properties, allOf }
        delete osduSchema.properties;
        if (debug) console.log("287 allOf", allOf);
        // hardcoded content add ../abstract/AbstractSystemProperties.json to the file
        const aspObj = JSON.parse(`{ "$ref": "../abstract/AbstractSystemProperties.1.0.0.json" }`); // insert abstractSystemProperties into the json-object
        osduSchema["allOf"] = [...allOf, aspObj];
        if (debug) console.log("291 ", osduSchema, aspObj);
    }

    if (debug) console.log("294 osduSchema", osduSchema);
    let newosduSchema = osduSchema;
    const externalID = newosduSchema.id || newosduSchema["$id"] || newosduSchema["x-osdu-schema-source"];
    newosduSchema.externalID = externalID;
    newosduSchema.name = newosduSchema.id ? newosduSchema.id.split(":").slice(-1)[0] : newosduSchema.title;
    // newosduSchema.id = null // remove id , it will be generated by the uuid function as AKMM id, the osdu id is put in the externalID

    if (debug) console.log("301", newosduSchema, newosduSchema["$id"], newosduSchema["x-osdu-schema-source"]);
    // if (osduSchema["$id"]) console.log('20',  osduSchema["$id"].split('/').slice(-1)[0]  );

    const topName = newosduSchema["$id"]
        ? newosduSchema["$id"].split("/").slice(-1)[0]
        : newosduSchema.id
            ? newosduSchema.id.split(":").slice(-1)[0]
            : newosduSchema["x-osdu-schema-source"].split(":")[1].split("--")[1];
    if (!debug) console.log("309", topName, newosduSchema);
    // const topName = (newosduSchema["$id"]) ? newosduSchema["$id"].split('/').slice(-1)[0] :  newosduSchema["x-osdu-schema-source"]

    // ------------------ create top object ------------------
    const topModel = { [topName]: newosduSchema }; // top object is given topName as key
    if (!debug) console.log("329", topModel);

    // deepEntries take all object-keys and concatenate them in curKey as a path showing all above levels and put them in a new array
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
        if (debug) console.log("280 deepEntries", obj);
        function formatKeys(entries: string | any[]) {
            entryK = entries.length;
            len += entries.length;
            while (entryK--) entries[entryK][0] = curKey + JSON.stringify(entries[entryK][0]) + "|"; // concatinate curKey with | as divider
            return entries;
        }
        allkeys = formatKeys(Object.entries(obj || {}));
        if (debug) console.log("288 allkeys : ", allkeys);
        allkeys = allkeys.sort(
            (firstItem: { key: number }, secondItem: { key: number }) => firstItem.key < secondItem.key
        );

        if (debug) console.log("293 allkeys sorted: ", allkeys);

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
                if (debug) console.log("307 :", i, entryK, len, curKey.slice(0, -1), allkeys[i][1]);

                // make a unique osduId for each object in the JSON-file by concatinating the path to the object with the name its keys
                // clean up the key path by removing the " in "key" first
                const cleanPath = curKey.slice(0, -1).replace(/"/g, ""); // clean key path ; remove "" from curkey to get a clean key string with the path as curKey

                let osduId = cleanPath;
                let newosduId: string;
                let newIdArray = osduId.split("|"); // make an array of all keys in the path

                if (osduId.includes("|definitions")) {
                    // definitions is in OSDU Generated folder and contain the osdu Json structure, so we strip off all above definitions
                    // Todo: we should find the object in the definition and make a new osduId for the object with properties
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
                if (debug) console.log("339 : ", oKey, curModel.objects.find((o: { name: string }) => o.name === oKey?.split("|")?.slice(-1)[0].split(".")[0] && o));

                // the osduId is lost so we have to find the object with the name and that has the same parentId as the object we are currently working on
                // const existName = curModel.objects.find((o: { name: string; }) => o.name === oKey?.split('|')?.slice(-1)[0].split('.')[0] && o) // use name as key to find the object in the model
                // const existParent = curModel.objects.find((o: { name: string; }) => o.name === otKey?.split('|')?.slice(-1)[0].split('.')[0] && o) // use name as key to find the object in the model
                // const existFromobject

                const existObj = curModel.objects.find((o: { osduId: any }) => o.osduId === oKey && o);
                const oId = existObj ? existObj.id : utils.createGuid();
                if (debug) console.log("348 : ", existObj, existObj?.id, oId, oKey, oVal);

                mainArray = [...mainArray, [oId, oKey, oVal]]; // we add the oId to the oKey and oVal in the mainArray so we can search for the id by oKey (the total path id)
                if (debug) console.log("351 ", mainArray);
            }
        return mainArray;
    }

    const osduArray = deepEntries(topModel); // find all the objects in the topModel and down the tree
    if (debug) console.log("407 deepEntries", osduArray);
    // ------------------ create objects and relationships ------------------
    // ----------------------------------------------------------------------
    // map through the osduArray and create objects and relationships between the objects
    const osduObjects = osduArray?.map((osduObj, index) => {
        const [oId, oKey, oVal] = osduObj;
        const schemaSource = oVal['x-osdu-schema-source'];
        const isMasterData = schemaSource?.includes("master-data");
        const isWorkProductComponent = schemaSource?.includes("work-product-component");
        const isReference = schemaSource?.includes("reference");
        const isAbstract = schemaSource?.includes("Abstract");

        if (debug) logDebugInfo("start", oKey, oVal, osduObj, index, isMasterData, inclMasterdata);

        if (!inclMasterdata && isMasterData) return;
        if (!inclWorkProductComponent && isWorkProductComponent) return;
        if (!inclReference && isReference) return;
        if (!inclAbstract && isAbstract) return;

        const oName = getLastElement(oKey, "|");
        const oValProps = filterObject(oVal);
        const parentName = getNthLastElement(oKey, "|", 2);
        const gparentName = getNthLastElement(oKey, "|", 3);
        const ggparentName = getNthLastElement(oKey, "|", 4);
        const jsonType = Array.isArray(oVal) ? "isArray" : "isObject";
        const entityPathElement = oVal.$id ? getLastElement(oVal.$id, "/") : "";
        const osduType = entityPathElement;
        const version = getLastElement(schemaSource, ":");

        if (debug) logDebugInfo("start", oName, oVal, jsonType, osduObj, parentName, gparentName);

        if (index === 0) {
            processTopObject(oId, oName, oKey, jsonType, osduType, { ...oValProps, groupType: entityPathElement, version }, oVal);
        } else if (isPropertyOrItem(parentName, gparentName)) {
            processPropertyOrItem(oId, oName, oKey, jsonType, osduType, oValProps, oVal, osduObj, curModel, objecttypeRef);
        } else if (oVal["$ref"] && inclAbstractPropLinks) {
            processRefObject(oId, oName, oKey, jsonType, osduType, oValProps, oVal, osduObj, curModel, objecttypeRef);
        } else if (oName === "items") {
            processItems(oId, oName, oKey, jsonType, osduType, oValProps, parentName, osduObj, curModel, objecttypeRef);
        } else if (inclXOsduProperties && isXOsduProperty(oName)) {
            processXOsduProperty(oId, oName, oKey, jsonType, osduType, oValProps, osduObj, curModel, objecttypeRef);
        } else if (inclGeneric) {
            processGenericObject(oId, oName, oKey, jsonType, osduType, oValProps, osduObj, curModel);
        }
    });

    function logDebugInfo(...args: any[]) {
        console.log(...args);
    }

    function getLastElement(str: string, delimiter: string) {
        return str?.split(delimiter)?.slice(-1)[0];
    }

    function getNthLastElement(str: string, delimiter: string, n: number) {
        return str?.split(delimiter)?.slice(-n, -n + 1)[0];
    }

    function isPropertyOrItem(parentName: string, gparentName: string) {
        return ["properties", "items"].includes(parentName) || ["properties", "items"].includes(gparentName);
    }

    function processPropertyOrItem(oId: string, oName: string, oKey: string, jsonType: string, osduType: string, oValProps: any, oVal: any, osduObj: any, curModel: any, objecttypeRef: any, parentName: string, gparentName: string, ggparentName: string) {
        if (oVal?.description?.includes('DEPRECATED') && !inclXOsduProperties) return;
        if (oVal["x-osdu-relationship"]) {
            processRelationships(oId, oName, oKey, jsonType, osduType, oValProps, oVal, osduObj, curModel, objecttypeRef);
        } else if (inclProps && oVal["x-osdu-frame-of-reference"]) {
            createPropertyObject(oId, oName, oKey, osduType, jsonType, oValProps, osduObj, curModel, objecttypeRef);
        } else if (inclArrayProperties && (oVal["x-osdu-indexing"] || oVal.type === "array")) {
            processArray(oId, oName, oKey, osduType, jsonType, oValProps, osduObj, curModel);
        } else if (inclProps && ["string", "number", "integer", "boolean"].includes(oVal.type)) {
            processSimpleProperty(oId, oName, oKey, osduType, jsonType, oValProps, osduObj, curModel, objecttypeRef, parentName);
        } else if (inclArrayProperties && oVal.type === "object") {
            processObjectProperty(oId, oName, oKey, osduType, jsonType, oValProps, osduObj, curModel, parentName, gparentName, ggparentName);
        } else if (typeof oVal.type === 'object') {
            processEnumProperty(oId, oName, oKey, osduType, jsonType, oValProps, osduObj, curModel, oVal.type);
        }
    }

    function processRefObject(oId: string, oName: string, oKey: string, jsonType: string, osduType: string, oValProps: any, oVal: any, osduObj: any, curModel: any, objecttypeRef: any) {
        const typeRest = getLastElement(oVal["$ref"], "/");
        const title = typeRest?.split(".")[0];
        oValProps.title = title;
        oValProps.refGroupType = getNthLastElement(oVal["$ref"], "/", 2);
        oValProps.referenceObject = title === "AbstractWorkProductComponent" ? title : title.replace("Abstract", "");
        const proxyName = `Is${oValProps.title}`;
        createObjectAndRelationships(oId, proxyName, oKey, osduType, jsonType, oValProps, osduObj, curModel, objecttypeRef);
    }

    function processItems(oId: string, oName: string, oKey: string, jsonType: string, osduType: string, oValProps: any, parentName: string, osduObj: any, curModel: any, objecttypeRef: any) {
        if (inclArrayProperties && parentName?.endsWith("s")) {
            const oMName = parentName.endsWith("ies") ? parentName.slice(0, -3) + "y" : parentName.slice(0, -1);
            processItemType(oId, oMName, oKey, osduType, jsonType, oValProps, osduObj, curModel);
        } else if (oVal.allOf) {
            const oOName = parentName.slice(0, -1);
            createObjectAndRelationships(oId, oName, oKey, osduType, jsonType, oValProps, osduObj, curModel, objecttypeRef);
        }
    }

    function isXOsduProperty(oName: string) {
        return ["required", "additionalProperties", "x-osdu-review-status", "x-osdu-virtual-properties", "x-osdu-inheriting-from-kind", "x-osdu-side-car-type-to", "x-osdu-supported-file-formats"].some(prop => oName.includes(prop));
    }

    function processXOsduProperty(oId: string, oName: string, oKey: string, jsonType: string, osduType: string, oValProps: any, osduObj: any, curModel: any, objecttypeRef: any) {
        const newOValProps = { ...oValProps, description: JSON.stringify(oValProps) };
        createPropertyObject(oId, oName, oKey, osduType, jsonType, newOValProps, osduObj, curModel, objecttypeRef);
    }

    function processGenericObject(oId: string, oName: string, oKey: string, jsonType: string, osduType: string, oValProps: any, osduObj: any, curModel: any) {
        const objecttypeRef = "5cc540c0-ea91-4401-74bb-4f7cb52a2366";
        createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps);
        findOwnerandCreateRelationship(oId, oName, osduObj, curModel);
    }

    function processSimpleProperty(oId: string, oName: string, oKey: string, osduType: string, jsonType: string, oValProps: any, osduObj: any, curModel: any, objecttypeRef: any, parentName: string) {
        createPropertyObject(oId, oName, oKey, osduType, jsonType, oValProps, osduObj, curModel, objecttypeRef);
        findOwnerandCreateRelationship(oId, oName, osduObj, curModel);
    }
    // ==================== -------------------- ==================== -------------------- ====================
    // -----------------------------------------------------------------------
    // -----------------------------------------------------------------------
    // crate relationships between objects
    // create function findOwnerandCreateRelationship(oId, oKey)
    function findOwnerandCreateRelationship(childId: string, childName: string, osObj: [any, any, any], curModel: any) {
        if (!osObj) return;
        if (debug) console.log("535 find and createRelship ...........", childId, childName, osObj, curModel);
        const topObj = mainArray[0];
        const topObjId = topObj[0];
        const topObjKey = topObj[1];
        const topObjName = topObj[1].split(".").slice(-1)[0];
        if (debug) console.log("539 topObjName", topObjName, topObjKey, topObj, osObj);
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
        if (debug) console.log("643 find and createRelship ...........", oKey, oName, parentName, gparentName, ggparentName, gggparentName, ggggparentName, gggggparentName, oVal);

        const existRel = curModel?.relationships?.find((r: { fromobjectRef: any }) => r.fromobjectRef === oKey && r);
        const relId = (existRel) ? existRel : utils.createGuid();
        const relDescription = "";
        const relTitle = "";
        reltypeRef = hasType?.id;
        reltypeName = hasType?.name;
        relshipKind = "Association";

        if (debug) console.log("653 findOwnerandCreateRelship... ", oName, parentName, gparentName, ggparentName, gggparentName, oVal);

        const toobjectId = childId;
        const toobjectName = childName;

        if (debug) console.log("658 relship  ", osObj, oName, oKey, oVal);
        // if (debug) console.log('584 relship  ', oName, parentName, gparentName, ggparentName, gggparentName, ggggparentName, gggggparentName, oKey, oVal);
        if (parentName === "properties") {
            // if the parent is properties, we have to find owner and create a relationship between the object and the owner object
            if (debug) console.log("562 ", oName, parentName, gparentName, ggparentName, oKey);
            if (gparentKey === topObjKey) {
                // if granparent is the top object, it is the owner
                const fromobjectId = topObjId;
                const fromobjectName = topObjName;

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
            } else if (gggparentKey === topObjKey) { // ??????
                // if gggparentKey is the same as topObjKey, we use the topObj as owner
                // console.log('475', gggparentKey, parentName,  topObjKey );
                const fromobjectId = topObjId;
                const fromobjectName = topObjName;
                if (debug) console.log("584 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
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

                // } else if (gparentName === "items") { // this is where ...s collection is handled
                //     // && ggparentName === 'Markers') { // if the greatgrandparent is items, we have to find owner and create a relationship between the object and the owner object
                //     const ownerObj = osduArray.find((o) => o[1] === gparentKey);
                //     const fromobjectId = ownerObj[0];
                //     const fromobjectName = ownerObj[1].split("|").slice(-1)[0];
                //     if (debug) console.log("717 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                //     if (fromobjectId && toobjectId)
                //         createRel(
                //             relId,
                //             reltypeName,
                //             relDescription,
                //             relTitle,
                //             reltypeRef,
                //             relshipKind,
                //             fromobjectId,
                //             fromobjectName,
                //             toobjectId,
                //             toobjectName
                //         );
            } else if (gparentName === "items" || ggparentName === "properties") {//  ???????? ????? ????? if 
                let ownerObj: string[], fromobjectId: string, fromobjectName: string;
                if (debug) console.log("734 ", oName, parentName, gparentName, ggparentName, oVal);
                if (parentName === "properties") {
                    // if the greatgrandparent properties, we have to find owner and create a relationship between the object and the owner object
                    ownerObj = osduArray.find((o) => o[1] === gparentKey);
                    if (debug) console.log("649 ", gparentKey, parentName, topObjKey, ownerObj);
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
                if (debug) console.log("650", gparentKey, parentName, topObjKey);
                // const toobjectId = oId;
                // const toobjectName = oName;
                if (debug) console.log("653 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
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
                // if the greatgrandparent is items, we have to find owner and create a relationship between the object and the owner object of items
                const toobjectId = oId
                const toobjectName = oName
                let fromobjectId = "";
                let fromobjectName = "";
                let ownerObj: string[];
                let currObj: string[];

                if (debug) console.log("676", oId, oName, parentName, gparentName, ggparentName, gggparentName, ggggparentName, topObjKey);
                if (oName === 'VerticalMeasurementID' && ggggparentName === 'VerticalMeasurements') {
                    ownerObj = osduArray.find(o => o[1] === gparentKey)
                    fromobjectId = ownerObj[0]
                    fromobjectName = ownerObj[1].split('|').slice(-1)[0]
                    console.log('782 ', ggggparentName, gggparentName, parentName, oKey);
                    if (debug) console.log('783 ---------', oName, fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                    // if (fromobjectId && toobjectId) createRel(relId, reltypeName, relDescription, relTitle, reltypeRef, relshipKind, fromobjectId, fromobjectName, toobjectId, toobjectName)
                } else {
                    // is this needed????
                    // ownerObj = osduArray.find((o) => o[1] === gparentKey);
                    // // currObj = osduArray.find((o) => o[1] === ggparentKey);
                    // if (debug) console.log("790 ", oName, parentName, gparentName, ownerObj, currObj);
                    // fromobjectId = ownerObj[0];
                    // fromobjectName = ownerObj[1].split("|").slice(-1)[0];
                }

                if (debug) console.log("793 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
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
                const ownerObj = osduArray.find((o) => o[1] === gparentKey);
                const fromobjectId = ownerObj[0];
                const fromobjectName = ownerObj[1].split("|").slice(-1)[0];
                if (debug) console.log("714 ---------", ownerObj, osduArray, fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
                if (debug) console.log("715 ---------", parentName, gparentName, ggparentName, gggparentName, ggggparentName, gggggparentName, oKey);
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
        } else if (oName === "items") { // this is where ...s collection is handled
            // if the greatgrandparent is items, we have to find owner and create a relationship between the object and the owner object
            const ownerObj = osduArray.find((o) => o[1] === parentKey);
            const fromobjectId = ownerObj[0];
            const fromobjectName = ownerObj[1].split("|").slice(-1)[0];
            if (debug) console.log("919 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
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
            const ownerObj = osduArray.find((o) => o[1] === ggparentKey);
            const fromobjectId = ownerObj[0];
            const fromobjectName = ownerObj[1].split("|").slice(-1)[0];
            if (debug) console.log("937 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
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
        } else if (parentKey === topObjKey) {
            // if the greatgrandparent is required, we have to find owner and create a relationship between the object and the owner object
            const ownerObj = osduArray.find((o) => o[1] === parentKey);
            const fromobjectId = ownerObj[0];
            const fromobjectName = ownerObj[1].split("|").slice(-1)[0];
            if (debug) console.log("1018 ---------", fromobjectName, reltypeName, toobjectName, fromobjectId, toobjectId);
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

    // ConnectImportedTopOSDUTypes("JSON", inclProps, props, dispatch)  // this will be run as a separate command

    function createObjectAndRelationships(
        oId: string,
        oName: string,
        oKey: string,
        osduType: string,
        jsonType: string,
        oValProps: any,
        osduObj: any,
        curModel: any,
        objecttypeRef: string
    ) {
        if (debug) console.log("1036 createObjectAndRelship", oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps, osduObj, curModel);
        createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps);
        findOwnerandCreateRelationship(oId, oName, osduObj, curModel);
    }
    //oId, oName, oKey, jsonType, osduType, oValProps, oVal
    function processTopObject(
        oId: string,
        oName: string,
        oKey: string,
        jsonType: string,
        osduType: string,
        oValProps: any,
        oVal: any
    ) {
        if (debug) console.log("1083 topObjName", oName, oKey, jsonType, osduType, oValProps, oVal);
        if (osduType === "reference-data" && !inclReference) return;
        if (osduType === "master-data" && !inclMasterdata) return;
        if (osduType === "abstract" && !inclAbstract) return;
        if (osduType === "work-product-component" && !inclWorkProductComponent) return;
        let topObjName = oName.replace(".json", "");  //.split(".")[0]
        if (debug) console.log("1093 topObjName", topObjName, oName, osduType, groupType);

        if (osduType === "Abstract") {
            oValProps.abstract = true;
        }
        objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "OSDUType")?.id;
        osduType = "OSDUType";
        groupType = oValProps.groupType;
        if (topObjName.includes("Abstract")) {
            if (topObjName !== "AbstractWorkProductComponent") {
                topObjName = topObjName.replace("Abstract", "");
                oValProps.abstract = true;
            }
        }
        createObject(oId, topObjName, objecttypeRef, oKey, osduType, jsonType, oValProps);
        if (debug) console.log("1108 topObject", topObjName, oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps, groupType);//
    }

    function processItemType(
        oId: string,
        oName: string,
        oKey: string,
        osduType: string,
        jsonType: string,
        oValProps: any,
        osduObj: any,
        curModel: any
    ) {
        if (debug) console.log("929 processOSDUType :", oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps, osduObj, curModel);
        objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Item")?.id;
        // if (oKey.endsWith("Items")) { osduType = "Items" } else { osduType = "Item" }
        osduType = "Item";
        createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps);
        findOwnerandCreateRelationship(oId, oName, osduObj, curModel);
    }

    function processProxies(
        oId: string,
        oName: string,
        oKey: string,
        osduType: string,
        jsonType: string,
        oValProps: any,
        osduObj: any,
        oVal: any,
        curModel: any,
        objecttypeRef: string
    ) {
        if (debug) console.log("981 parent = properties :", oName, oVal, oValProps, inclPropLinks);
        if (inclPropLinks && oVal["x-osdu-relationship"]) {
            objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Proxy")?.id;
            // oValProps.OSDUType = oName;
            if (debug) console.log("996  relationship", oName, objecttypeRef, oValProps, oVal["x-osdu-relationship"]);
            createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps);
            if (debug) console.log("980 a-osdu-relship ", oId, oName, objecttypeRef, oKey, osduType, jsonType, osduObj, oValProps);
            findOwnerandCreateRelationship(oId, oName, osduObj, curModel);
        }
    }

    function processArray(
        oId: string,
        oName: string,
        oKey: string,
        osduType: string,
        jsonType: string,
        oValProps: any,
        osduObj: any,
        curModel: any
    ) {
        if (debug) console.log("999  array Set: ", oId, oName, objecttypeRef, oKey, jsonType, oValProps);
        // if includeArrayProperties is false, we do not create the array properties
        if (!inclArrayProperties) return;
        switch (true) {
            case oName.substring(oName.length - 3) === "Set" || oName === "Markers" || oName === "CandidateReferenceCurveIDs" || oName === "GeologicUnitInterpretationIDs":
                objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Array")?.id;
                oValProps.viewkind = "container";
                createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps);
                if (debug) console.log("1007  array :", oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps, osduObj, curModel);
                findOwnerandCreateRelationship(oId, oName, osduObj, curModel);
                break;
            case oName.includes("ID") || oName.includes("IDs"):
                if (oName === "MarkepLId" || oName === "IntervalID" || oName === "VerticalMeasurementID") {
                    // do nothing
                } else {
                    if (debug) console.log("1014  array", oId, oName, oKey, jsonType, oValProps);
                    objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Array")?.id;
                    let OSDUType = oName.replace("ID", ""); // remove ID from the name
                    const proxyName = "has" + oName;
                    oValProps.OSDUType = oName;
                    createObject(oId, proxyName, objecttypeRef, oKey, osduType, jsonType, oValProps);
                    if (debug) console.log("1020  array ID", oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps, osduObj, curModel);
                    findOwnerandCreateRelationship(oId, oName, osduObj, curModel);
                }
                break;
            case oValProps["$ref"]:
                objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Array")?.id;
                createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps);
                if (debug) console.log("1097  array $ref", oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps, osduObj, curModel);
                findOwnerandCreateRelationship(oId, oName, osduObj, curModel);
                break;
            default:
                if (debug) console.log("418  ProcessArray", oId, oName, oKey, jsonType);
                objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Array")?.id;
                if (oName === "Markers") oName = oName.substring(0, oName.length - 1); // remove the last character from the name
                createObject(oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps);
                if (debug) console.log("1105  array else", oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps, osduObj, curModel);
                findOwnerandCreateRelationship(oId, oName, osduObj, curModel);
                break;
        }
    }



    function createPropertyObject(
        oId: string,
        oName: string,
        oKey: string,
        osduType: string,
        jsonType: string,
        oValProps: any,
        osduObj: any,
        curModel: any,
        objecttypeRef: string
    ) {
        objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Property")?.id;
        if (debug) console.log("1289  property", oId, oName, oKey, osduType, jsonType, oValProps, osduObj, curModel, objecttypeRef);
        createObjectAndRelationships(oId, oName, oKey, osduType, jsonType, oValProps, osduObj, curModel, objecttypeRef);
    }

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

    // function process(key: any, value: any) {
    //     //called with every property and its value
    //     // if (key === "id") key = "$id"  // We will use our own uuid so rename if source has id
    //     // if (key === 'name' && (!value))  key = "contryName"
    //     const attribute = { [key]: value };
    //     return attribute;
    // }

    // function extractRegex(inputString, regex) {
    //     // extract the GroupType and OSDUType from the string
    //     // const regex = /^[\w\-\.]+:(reference-data\-\-WellBusinessIntention):[\w\-\.\:\%]+:[0-9]*$/;
    //     // const match = inputString.match(regex);
    //     // Split the string by colon and return the reference-data and WellBusinessIntention parts
    //     const parts = inputString.split(":");
    //     const GroupAndType = parts[1].split("--");
    //     return {
    //         GroupType: referenceDataAndIntention[0],
    //         OSDUType: referenceDataAndIntention[1],
    //     };
    // }

    // Example usage
    // const input = "user-name:reference-data--WellBusinessIntention:some%data:12345";
    // const result = extractReferenceDataAndWellBusinessIntention(input);
    // console.log(result);
    // Output: { referenceData: 'reference-data', wellBusinessIntention: 'WellBusinessIntention' }
};

   // function processPrimitiveType(
    //     oId: string,
    //     oName: string,
    //     oKey: string,
    //     osduType: string,
    //     jsonType: string,
    //     oValProps: any,
    //     osduObj: any,
    //     curModel: any,
    //     objecttypeRef: string
    // ) {
    //     if (debug) console.log("1092  primitive", oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps, osduObj, curModel);
    //     const objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Property")?.id;
    //     create P
    //     // if (inclPropLinks && oName.length > 4 && oName.substring(oName.length - 4) === "Type") {
    //     //     oValProps.OSDUType = oName;
    //     //     const proxyName = "has" + oName;
    //     //     objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Proxy")?.id;
    //     //     if (debug) console.log("1164  primitive", oId, oName, oKey, osduType, jsonType, oValProps, osduObj, curModel, objecttypeRef);
    //     //     createObjectAndRelationships( oId, oName, oKey, osduType, jsonType, oValProps, osduObj, curModel, objecttypeRef);
    //     // } else if (inclAbstractPropLinks && oName.substring(0, 8) === "Abstract") {
    //     //     oValProps.OSDUType = oName;
    //     //     if (oValProps.OSDUType === "AbstractCommonResources") {
    //     //         oValProps.OSDUType = "OSDUCommonResources";
    //     //     }
    //     //     const proxyName = "has" + oName;
    //     //     objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Proxy")?.id;
    //     //     createObjectAndRelationships( oId, oName, oKey, osduType, jsonType, oValProps, osduObj, curModel, objecttypeRef);
    //     // } else if (inclProps) { // property
    //     //     createPropertyObject(oId, oName, oKey, osduType, jsonType, oValProps, osduObj, curModel, objecttypeRef);
    //     // }
    // }

    // function createLinkedObject(
    //     oId: string,
    //     oName: string,
    //     oKey: string,
    //     osduType: string,
    //     jsonType: string,
    //     oValProps: any,
    //     osduObj: any,
    //     curModel: any,
    //     objecttypeRef: string
    // ) {
    //     const proxyName = `${parentName}`;
    //     // const proxyName = `has${oName}`;
    //     objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Proxy")?.id;
    //     oValProps.OSDUType = proxyName;
    //     oValProps.linkID = proxyName;
    //     createObjectAndRelationships(oId, proxyName, oKey, osduType, jsonType, oValProps, osduObj, curModel, objecttypeRef);
    //     if (debug) console.log("1189 Arrays", oId, oName, oKey, osduType, jsonType, oValProps, osduObj, curModel, objecttypeRef);
    //     // createObject(oId, proxyName, objecttypeRef, oKey, osduType, jsonType, oValProps);
    //     // if (debug) console.log("349 Set", oId, proxyName, objecttypeRef, oKey, jsonType, oValProps);
    //     // findOwnerandCreateRelationship(osduObj, curModel);
    // }

    // function createArrayObject(
    //     oId: string,
    //     oName: string,
    //     oKey: string,
    //     osduType: string,
    //     jsonType: string,
    //     oValProps: any,
    //     osduObj: any,
    //     curModel: any,
    //     objecttypeRef: string
    // ) {
    //     const objecttypeRef = curObjTypes.find((ot: { name: string }) => ot.name === "Array")?.id;
    //     const reltypeRef = containsType?.id;
    //     const reltypeName = containsType?.name;
    //     const relshipKind = "Association";
    //     createObjectAndRelationships( oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps, osduObj, curModel);
    //     if (debug)console.log("1189 Arrays", oId, oName, objecttypeRef, oKey, osduType, jsonType, oValProps, osduObj, curModel);
    //     // createObject(oId, oMName, objecttypeRef, oKey, osduType, jsonType, oValProps, groupType);
    //     // findOwnerandCreateRelationship(osduObj, curModel);
    // }