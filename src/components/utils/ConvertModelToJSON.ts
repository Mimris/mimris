// @ts-nocheck

const debug = false

// export const WriteConvertModelToJSONFile = async (model, name, type) => {
export const WriteConvertModelToJSONFile = async (model, name, type) => {

    const objectsToConvert = model.objects  // ToDo:  this must be only objects from  current modelview
    // Filter only objects from current modelview

    // console.log('12', 'objectsToConvert: ', objectsToConvert);˜þ
    const convertedModel = ConvertObjectsToJsonStructure(objectsToConvert);
    // console.log('14', 'ConvertedObjects: ', convertedModel);
    // const jsonObjWithArray = convertedModel.map(obj => (obj.allOf) ? Object.keys(obj).map(k => obj[k]) : obj)
    console.log('18', model.objects[0]);
    
    const today = new Date().toISOString().slice(0, 19)
    // const fileName = type+"_"+name+'_'+today;
    // const fileName = today+"_"+name+'_Osdu-JSON-Import';
    const fileName = name+'_Osdu-JSON-Import';

    const json = convertedModel //JSON.stringify(convertedModel);
    // const json = JSON.safeStringify(convertedModel);
    // const blob = new Blob([json], {type:'application/json'});
    const blob = new Blob([json], {type:'application/txt'});  // downlaod as txt file
    const href = URL.createObjectURL(blob);
    // const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    if (debug) console.log('25', convertedModel, json, '\n blob : ', blob, href, link, link.href );
    
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export const ConvertObjectsToJsonStructure = (objects) => {

    // const objectlist = objects.map(o => [o.osduId, o])
    console.log('36', objects[0] );
    objects.sort((a,b) => (a.osduId > b.osduId) ? 1 : ((b.osduId > a.osduId) ? -1 : 0))

    let objAll = '{'
    let preChar = '{'
    let postChar = '}'
    // let prePath = [' ']
    // let postPathStr = ' '
    let postPath = []
    let lastChar = ''
    let restChar = ''    
    let restPath = []
    // let previousLength = 0
    
    const genJsonObj = (objects) => {
        if (debug) console.log('51 : ', objects.map(o => o.osduId));
        
        const jsonobj = objects.map((o, i) =>  { 
            const curOsduId = o.osduId
            const current = o.osduId.split('|').slice(-1)[0] //.join('|')
            const parentOsduId = o.osduId.split('|').slice(0, -2).join('|')
            const parent = o.osduId.split('|').slice(-2)[0] //.join('|')
            const prevOsduId = objects[i-1]?.osduId
            const previous = objects[i-1]?.osduId.split('|').slice(-1)[0]
            const nextOsduId = objects[i+1]?.osduId
            const next = objects[i+1]?.osduId.split('|').slice(-1)[0] //.join('|')
            const nextParent = objects[i+1]?.osduId.split('|').slice(-1)[0]

            let filteredObj
            if (o.name === 'required') { // special handling for required , it has just a list of propertynames.
                const propNameList = o.propNames.split(',')
                filteredObj =    JSON.stringify(propNameList)
            } else {
                filteredObj = JSON.stringify(filterObject(o)) // keep only attributes (remove objects)
            }
            // console.log('55', o, filteredObj);
            const removedLastChar = (filteredObj !== 'false') ? filteredObj.slice(0, -1) : '' // remove the last }
            const removedFirstAndLastChar = (filteredObj !== 'false') ? removedLastChar.substring(1) : '' // remove first {

            const prevLength = prevOsduId?.split('|').length 
            const curLength  = curOsduId?.split('|').length 
            const nextLength = nextOsduId?.split('|').length || 0
            const restLength = prevLength - curLength 

            if (debug) console.log(`77
                prev        : %c ${prevOsduId}  : %c ${previous} 
                curOsduId   : %c ${curOsduId}   : %c ${current} 
                next        : %c ${nextOsduId}  : %c ${next}
                parent      : %c ${parentOsduId}: %c ${parent} 
                `,
                "color: green",
                "color: blue",
                "color: green",
                "color: blue",
                "color: green",
                "color: blue",
                "color: green",
                "color: blue",
            );

            if (debug) console.log('96  prev, cur, next, rest :', 
                prevLength, curLength, nextLength, restLength, 
                ((curLength > prevLength) || (curLength !== nextLength ))
            );
            preChar = (o.jsonType === 'isArray') ? '[' : '{'
            postChar = (o.jsonType === 'isArray') ? ']' : '}'

            postPath.unshift(postChar) // putting postChar at the beginning of the array
            // console.log('105  postChar: ', postChar, 'postPath: ', postPath )

            if (debug) console.log('107 ',
                        '\n pc ', postChar,
                        '\n pp ', postPath,
                        '\n pp0', postPath[0],
                        '\n lc ', lastChar,
                        '\n rpc', restChar,
                        // '\n ', ` ${removedFirstAndLastChar}`,
                    )
            
            // prepare current object 
            let thisobjAll = (!isNaN(o.jsonKey)) 
                ? `${preChar}${removedFirstAndLastChar}`
                : `"${o.jsonKey}": ${preChar}${removedFirstAndLastChar}`

            //create function to make a restPath wile removing the last char of the postPath
            const makeRestChar = (i) => {
                restPath = []
                i = (i) ? i : curLength - nextLength ; 
                do { 
                    const rest = postPath.shift(); 
                    restPath.unshift(rest)
                    i=i-1
                } while ( i > 0)
                return (restPath.length > 1) ? restPath.reverse().join('') : restPath[0]
            } 

            // if we are traversing back (up the tree), we need to use the postChar and remove it from the postPath
            if ((curLength > prevLength) && (curLength !== nextLength)) {
                if (debug) console.log('127', curLength, prevLength, nextLength, postPath, postChar);
                if (prevLength > curLength) {
                    restChar = makeRestChar()
                    if (debug) console.log('129',prevLength, curLength, nextLength, restChar)
                } else if (curLength > prevLength && curLength > nextLength ) {
                    const i = (curLength - prevLength) + (curLength - nextLength)
                    restChar = makeRestChar(i)+','
                    if (debug) console.log('133', prevLength, curLength, nextLength, i, restChar)
                } else if (curLength > prevLength && curLength < nextLength) {
                    restChar = ','
                    if (!debug) console.log('137', prevLength, curLength, nextLength, restChar, o)
                } else {
                    restChar = ''
                    if (!debug) console.log('139', prevLength, curLength, nextLength, restChar)
                }
            } else  if (curLength === prevLength) {
                if (curLength < nextLength) {
                    if ((thisobjAll.charAt(thisobjAll.length-1) === '{')) {
                        restChar = ''
                        if (debug) console.log('143', thisobjAll, prevLength, curLength, nextLength, restChar)
                    } else {
                        restChar = ','
                        if (debug) console.log('146', prevLength, curLength, nextLength, restChar)
                    }
                } else {
                    const i = (curLength - prevLength) + (curLength - nextLength)
                    restChar = makeRestChar(i)+','
                    if (debug) console.log('151', prevLength, curLength, nextLength, i, restChar)
                }
            } else {
                if (!prevLength) {
                    restChar = ','
                    if (debug) console.log('156', prevLength, curLength, nextLength, restChar)
                } else if (!((prevLength === curLength) || (curLength === nextLength))) {
                    const i = 3
                    restChar = makeRestChar(i)+','
                    if (debug) console.log('160', prevLength, curLength, nextLength, i, restChar)
                } else {
                    restChar = makeRestChar()+','
                    if (debug) console.log('163', prevLength, curLength, nextLength,  restChar)
                }
            }

            // lastChar = restChar 
            thisobjAll += restChar  // add last char
            
            if (debug) console.log('172 restPath : ', restPath, 'postPath : ',postPath, 'restChar : ', restChar);       
            if (debug) console.log('173 #######------- \n', 'o.jkey : ', o.jsonKey, '\n', thisobjAll);
            
            objAll += thisobjAll
            // console.log('166 ', objAll);
        })

        objAll += postPath.reverse().join(',') //add in reverse the last postChar's to the end of the json string
        objAll = objAll + '}' // add the last } to the end of the json string
        // console.log('99 objects',  objects)

        // remove uneccessary , in beginning objects and arrays
        const JSONObject = objAll.replace(/,}/g, '}').replace(/,]/g, ']').replace(/{,/g, '{').replace(/\[,/g, '[') //.replace(/\",}/g, '"}').replace(/,}/g, '}}').replace(/{,/g, '{')
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
    newobj = (obj?.osduId.split('|').slice(-1)[0] === "allOf") || (obj?.osduId.split('|').slice(-1)[0] === "items") && [] // ToDo: remove allOf and replace with isArray ??

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
        if (i === 'jsonKey') continue;
        if (i === 'jsonType') continue;
        if (i === 'osduId') continue;
        if (obj[i] === '') continue; // if empty, we don't want it
        const tmpkey = i
        if (i === 'osduType') tmpkey = 'type' // type is a akmm attribute probably not the same as osdu attribute

        newobj = {
                    ...newobj,
                    [tmpkey]: obj[i]
                } 
        // console.log('251', i, obj[i], newobj);
    }
    // console.log('286 :', obj, newobj);
    return (newobj === false || newobj === true) ? '' : newobj;
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
