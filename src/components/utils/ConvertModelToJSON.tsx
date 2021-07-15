// @ts-nocheck

import { stringify } from "querystring";

const debug = false



// export const WriteConvertModelToJSONFile = async (model, name, type) => {
export const WriteConvertModelToJSONFile = async (model, name, type) => {

    const objectsToConvert = model.objects

    // console.log('12', 'objectsToConvert: ', objectsToConvert);
    const convertedModel = ConvertObjectsToJsonStructure(objectsToConvert);
    // console.log('14', 'ConvertedObjects: ', convertedModel);
    // const jsonObjWithArray = convertedModel.map(obj => (obj.allOf) ? Object.keys(obj).map(k => obj[k]) : obj)
    // console.log('18', 'jsonObjWithArray: ', jsonObjWithArray);
 
    
    const today = new Date().toISOString().slice(0, 19)
    const fileName = type+"_"+name+'_'+today;
    

    const json = JSON.safeStringify(convertedModel);
    const blob = new Blob([json], {type:'application/json'});
    const href = URL.createObjectURL(blob);
    // const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    // console.log('25',  json, '\n blob : ', blob, href, link, link.href );
    
    // link.download = fileName + ".json";
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
}

export const ConvertObjectsToJsonStructure = (objects) => {

    // const objectlist = objects.map(o => [o.id, o])
    // console.log('36', objects[0]);
    objects.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))

    let objAll = '{'
    let preChar = '{'
    let postChar = '}'
    let prePath = [' ']
    let firstPath = ' '
    let postPath = [' ']
    let lastPath = [' ']
    let previousLength = 0
    let previousParent = ''
    
    const genJsonObj = (objects) => {
        // console.log('56 : ', objects);
        
        const jsonobj = objects.map((o, i) =>  { 
            let hasObj = false
            // if (i < objects.length) {
                hasObj = (objects[i+1]?.JSONKey === 'items') && true
            // }

            const current = o.id.split('|').slice(-1)[0] //.join('|')
            const parent = o.id.split('|').slice(-2)[0] //.join('|')
            const prev = objects[i-1]?.id
            const next = objects[i+1]?.id
            const nextParent = objects[i+1]?.id.split('|').slice(-2)[0]
            const curId = o.id

            const filteredObj = JSON.stringify(filterObject(o)) // keep only attributes (remove objects)
            const removedLastChar = filteredObj.slice(0, -1) // remove the last }
            const removedFirstAndLastChar = removedLastChar.substring(1) // remove first {
            
            // console.log('79 : ', o.JSONKey, objects[i+1]?.JSONKey, i, i+1);
            
            
            preChar = " " 
            postChar = " "
        
            prePath = [...prePath, preChar]
            postPath = [...postPath, postChar]    
            // console.log('83 \n prev : ', prev,' \n curId : ', curId, '\n next : ', next, '\n parent : ' , parent, '\n ' , hasObj);
            
            const prevLength = prev?.split('|').length 
            const curLength = curId?.split('|').length 
            const nextLength = next?.split('|').length 
            const restLength = prevLength - curLength 
            // console.log('89 : ', prevLength, curLength, nextLength, restLength);

            if (o.JSONKey === undefined) {
                objAll += `{ ${removedFirstAndLastChar} ,`
            } else if ((o.id.split('|').slice(-1)[0] === "allOf")) {
                objAll += `"${o.JSONKey}": [ ${removedFirstAndLastChar} ` 
            } else if (!isNaN(o.JSONKey)) {
                objAll += (removedFirstAndLastChar.includes("$ref")) 
                    ? (restLength < 1 ) ? `{ ${removedFirstAndLastChar}},` : `}},{ ${removedFirstAndLastChar}}`
                    : `{ ${removedFirstAndLastChar},`
            } else  if  (!hasObj) {
                objAll += (parent === "properties")  
                    ? `"${o.JSONKey}": { ${removedFirstAndLastChar} },` // error a , to much
                    : (current === 'properties' || current === 'items') 
                        ?`"${o.JSONKey}": { ${removedFirstAndLastChar}` 
                        :`"${o.JSONKey}": { ${removedFirstAndLastChar},` 
            } else if (parent === "items")  {
                objAll += `"${o.JSONKey}": { ${removedFirstAndLastChar}},`     
            } else {
                objAll += `"${o.JSONKey}": { ${removedFirstAndLastChar},`  
            }

            
            const myParent = (c) =>  c.split('|').slice(-2)[0]
            const myPId = (c) => c.split('|').slice(0, -1).join('|')
            // console.log('130 : ', myParent(curId));
            // console.log('132 : ', myPId(curId));
            
            let n = prevLength - curLength
            let pn = curId  
            if (n > 0) {
            // if ((next === undefined)) {      
                // objAll += '}'       
                while (n > 0) {
                    const nextP =  myParent(pn)               
                    // console.log('135 : ', n, pn, nextP);             
                    objAll += (nextP === 'allOf')
                        ? ']' 
                        : '},'                
                    pn = myPId(pn)
                    n--;
                }
            } 
            
            let nn = curLength - 2
            if (next === undefined) {
                while (nn > 0 ) {
                    const nextP =  myParent(pn)               
                    // console.log('135 : ', n, pn, nextP);             
                    objAll += (nextP === 'allOf')
                        ? ']' 
                        : '}'                 
                    pn = myPId(pn)
                    nn--;
                }
            }

            lastPath = postPath.pop()
            firstPath = prePath.pop()

            previousLength = o.id.split('|').length
            previousParent = parent

            // console.log('89 : prePath', preChar, '\n objAll : ', objAll, '\n postPaht: ', postChar);
            
        
            // postChar = (o.id === parent) ? postPath.splice(0, postPath.length-1) : '---'
            // postPath.shift()
        })


        const oVal = filterObject(objects[0]) // remove objects as attributes
        const oVal1 = filterObject(objects[1]) // remove objects as attributes
        let prevOId


        // console.log('99 objects',  objects)
        const JSONObject = objAll.replace(/\",}/g, '"}').replace(/},}/g, '}}').replace(/,}/g, '}}')
        // console.log('167 ', JSONObject)  
       
        return JSONObject
        

    };

    const generatedJSON =  genJsonObj(objects);

    console.log('132 : ', generatedJSON);
   
    return generatedJSON
    
}


  // filter to get only attributes (objects removed)
  function filterObject(obj) {
    let newobj = {} 
    newobj = (obj?.id.split('|').slice(-1)[0] === "allOf") && []

    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object')  continue ;
        if (typeof obj[i] == undefined) continue;
        if (i === 'abstract') continue;
        if (i === 'generatedTypeId') continue;
        if (i === 'markedAsDeleted') continue;
        if (i === 'objectviews') continue;
        if (i === 'typeName') continue;
        if (i === 'typeRef') continue;
        if (i === 'viewkind') continue;
        if (i === 'modified') continue;
        if (i === 'id') continue;
        if (i === 'name') continue;
        if (i === 'JSONKey') continue;

        const tmpkey = i
        if (i === 'osduType') tmpkey = 'type' // type is a akmm attribute probably not the same as osdu attribute

        newobj = {
                    ...newobj,
                    [tmpkey]: obj[i]
                } 
            // console.log('130', i, obj[i], newobj);
    }
    // console.log('132 :', obj, newobj);
    return newobj;
}

// safely handles circular references
JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
};





      //---------------------------------------------------------------------------------------------
        // const genJSON = (obj) => prePaht + `"${obj.JSONKey}": ${JSON.stringify(filterObject(obj)).slice(0, -1)}` +postPath


        // const jsonobj = `{${objects.map(o =>  { 
        //     const parentId = o.id.split('|').slice(0, -1).join('|')
        //     const grandParentId = o.id.split('|').slice(0, -2).join('|')
        //     const prevParentId = prevOId?.split('|').slice(0, -1).join('|')
        //     const prevGParentId = prevOId?.split('|').slice(0, -2).join('|')
        //     const prevGGParentId = prevOId?.split('|').slice(0, -3).join('|')
        //     const prevGGGParentId = prevOId?.split('|').slice(0, -4).join('|')
        //     const prevGGGGParentId = prevOId?.split('|').slice(0, -5).join('|')
            // if (!isNaN(obj))  
            // const ret = 
            //     (!prevOId && !parentId && !grandParentId) 
            //     ? genJSON(o)
            //     : (!parentId && !grandParentId) 
            //         ? '}}},'+genJSON(o)
            //         : (!parentId)
            //             ? genJSON(o)
            //             : (!grandParentId && (o.id === prevParentId ))
            //                 ? '}},'+genJSON(o) 
            //                 : (parentId === prevOId) 
            //                     ? genJSON(o)  
            //                     : (parentId === prevParentId) 
            //                         ? '},'+genJSON(o) 
            //                         : (parentId === prevGParentId) 
            //                             ? '}},'+genJSON(o) 
            //                             : (parentId === prevGGParentId) 
            //                                 ? '}}},'+genJSON(o) 
            //                                 : (parentId === prevGGGParentId) 
            //                                     ? '}}}}'+genJSON(o) 
            //                                     : (parentId === prevGGGGParentId) 
            //                                         ? '}}}}}'+genJSON(o) 
            //                                         : '}'
            
            // console.log(
            //     '58 oid :', o.id, 
            //     '\n parentId : ', parentId, 
            //     '\n grandParentId : ', grandParentId, 
            //     '\n prevOId : ', prevOId, 
            //     '\n prevParentId : ' , prevParentId,
            //     '\n prevGParentId : ' , prevGParentId,
            //     '\n prevGGParentId : ' , prevGGParentId
            //     );
        //     console.log('93 ret :', ret);
            
        //     prevOId = o.id
        //     return ret
        // } ) } }}}}}}`