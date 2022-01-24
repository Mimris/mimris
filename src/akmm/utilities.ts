// @ts-nocheck
// Utility functions
const debug = false;

const constants = require('./constants');

let showAdminModel = false;

export function toggleAdminModel(): boolean {
    showAdminModel = !showAdminModel;
    return showAdminModel;    
}

export function getShowAdminModel() {
    return showAdminModel;
}

export function isAdminType(type): boolean {
    if (type.name === constants.admin.AKM_PROJECT
        ||
        type.name === constants.admin.AKM_METAMODEL
        ||
        type.name === constants.admin.AKM_MODEL
        ||
        type.name === constants.admin.AKM_MODELVIEW
        )
        return true;
    else
        return false;
}

export let isArrayEmpty = (array: any) => {
    let retval = false;
    if (array == null)
        retval = true;
    else if (array.length == 0)
        retval = true;
    return retval;
}


export let nameExistsInNames = (names: string[], name: string) => {
    for (let i = 0; i < names.length; i++) {
        const n = names[i];
        if (n === name)
            return true;
    }
    return false;
}

export let objExists = (obj: any) => {
    let retval = true;
    if (obj == null)
        retval = false;
    else if (obj === "")
        retval = false;
    return retval;
}

export let S4 = () => {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

export let createGuid = () => {
    return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}

export let removeElementFromArray = (arr: any[], id: string) => {
    for (let i = 0; i < arr.length; i++) {
        const element = arr[i];
        if (objExists(element)) {
            let element_id = element?.id;
            if (!element_id) element_id = element?.key;
            if (element_id === id) {
                arr.splice(i, 1);
                break;
            }
        }
    }
}

export function camelize(str: string): string {
    return str.replace(/\W+(.)/g, function(match, chr) {
        return chr.toUpperCase();
    });
}

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function uncapitalizeFirstLetter(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

export function removeArrayDuplicates(array: any): any {
    const uniqueSet = new Set(array); 
    const uniqueArray = [...uniqueSet];
    // array.filter((item, index) => array.indexOf(item) === index);
    // array.reduce((unique, item) => 
    //     unique.includes(item) ? unique : [...unique, item], []);
    return uniqueArray;
}

export function compare(a: any, b: any) {
    if (a.name < b.name){
      return -1;
    }
    if (a.name > b.name){
      return 1;
    }
    return 0;
  }

export function isNumeric(str: string) {
    return typeof(str) === 'number';
}

// -----------  TEMPLATES -----------------

// ---------  Read key value arrays -------
export let readKeyValueArrays = (myArray: any[]) => {
    const items = myArray;
    if (isArrayEmpty(items))
        return;
    items.forEach(function (item) {
        Object.keys(item).forEach(function (key) {
            console.log("key: " + key + " value " + item[key]);
            const propkey = key;
            const propval = item[key];
            console.log(propkey + ": " + propval);
        });
    });
}

export function findObjectsByType(objects: any, objecttypes: any,  objTypeName: string) {
    const objtype = objecttypes.find(ot => ot.name === objTypeName && ot);
    if (debug) console.log('109 ', objecttypes, objects, objTypeName, objtype.id);
    if (debug) console.log('111 ', objecttypes.filter(ot => ot.name === objTypeName && ot), objects.filter(o => o.typeRef === objtype.id && o));
   return objects.filter(o => o.typeRef === objtype.id && o);
}

export function findObjectByName(objects: any, arg1: {}, restName: any) {
    return objects.find(o => o.name === restName && o);
}
export function findObjectByTitle(objects: any, arg1: {}, restTitle: any) {
    return objects.find(o => o.name === restTitle && o);
}

export function findFromObjects( o: any, objects: any, torships: any ) {
    if (debug) console.log('120 findFromObjects', o, objects, torships);
   
    // const torships = relationships?.filter(r => r.toobjectRef === o.id && r); // find all relships to current obj object
    const fromObj = torships?.map(r => objects?.find(o => o.id  === r.fromobjectRef)); // find objects in the other end of the relationship
    if (debug) console.log('124 ', torships, fromObj);
    return fromObj
    
}

export function findTopLevelObject( o: any, type: string, objects, relationships ) { // Todo: find top level object by traversing the relships

    // find to reationship and traverse relationships to find the top level object
    // hardcoded for now, by traversin 2 steps from the current object to the top level object
    if (debug) console.log('133 ', o.name);
    const torships1 = relationships?.filter(r => r.toobjectRef === o.id && r); // find all relships to current obj object
    const fromObj1 =  objects?.find(o => o.id  === torships1[0].fromobjectRef); // find object in the other end of the relationship (assuming only one)
    if (debug) console.log('135 ', fromObj1, torships1, torships1[0]);
    
    // const fromObj1 = torships1?.map(r => objects?.find(o => o.id  === r.fromobjectRef)); // find object in the other end of the relationship (assuming only one)
    const torships2 = relationships?.filter(r => r.toobjectRef === fromObj1?.id && r); // find all relships to current obj object
    if (debug) console.log('139 ', torships2);
    const fromObj2 =  (torships2[0]) && objects?.find(o => o.id  === torships2[0].fromobjectRef); // find object in the other end of the relationship (assuming only one)
    // const fromObj2 = torships1?.find(r => objects?.find(o => o.id  === r.fromobjectRef)); // find object in the other end of the relationship (assuming only one)
    
    const topObj = fromObj1 || fromObj2;
    if (debug) console.log('140 ', fromObj1,  fromObj2, topObj);

    return topObj;
    
}

export function findRelshipByToIdAndType(curRelships: any, toObjId: string, relType: string) {
    if (debug) console.log('151 ', curRelships, toObjId, relType);
    const relship = (toObjId) ? curRelships?.find(r => r.toobjectRef === toObjId && r.typeRef === relType) : null;
    return relship;
}
