export function ObjectToCsv(obj: Record<string, any>){

    // console.log('3 ObjectToCsv obj', obj.obj);
    // console.log('7 obj', obj);
    const keys = Object.keys(obj.obj);
    const values = Object?.values(obj.obj);
    // console.log('20 keys1', keys, values);
    const header = keys.join(";");
    const valueList = values.join(";");
    // console.log('10 valuesList, values',  valueList, values);
    return ({valueList});
}