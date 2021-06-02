// @ts-nocheck
// Utility functions

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



