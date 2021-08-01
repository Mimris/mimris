// // read and convert OSDU Json format

// export const ReadConvertJSONFromFile = async (props, dispatch, e) => {
//   e.preventDefault()
//   const reader = new FileReader()

//   // reader.fileName = file.name
//   reader.onload = async (e) => { 
//       const text = (e.target.result)
//       const osduMod = JSON.parse(text) // importert JSON file
//       const topName = "json"
//       const topModel ={[topName]: osduMod} // top object is given topName as key 

//       function deepEntries( obj ){
//           'use-strict';
//           var allkeys, curKey = '[', len = 0, i = -1, entryK;
      
//           function formatKeys( entries ){
//              entryK = entries.length;
//              len += entries.length;
//              while (entryK--)
//                entries[entryK][0] = curKey+JSON.stringify(entries[entryK][0])+']';
//              return entries;
//           }
//           allkeys = formatKeys( Object.entries(obj || {}) );
      
//           while (++i !== len)
//               if (typeof allkeys[i][1] === 'object' && allkeys[i][1] !== null){
//                   curKey = allkeys[i][0] + '[';
//                   Array.prototype.push.apply(
//                       allkeys,
//                       formatKeys( Object.entries(allkeys[i][1]) )
//                   );
//                   console.log('35 :', curKey, curKey[1], allkeys[i][1]);
              
//                   // const importedObject = {}
//                   // dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: importedObject } );  
//               }
//           return allkeys;
//       }

//       // console.log('39  :',
//           deepEntries(topModel)
//       // ) 
//       function stringifyEntries(allkeys){
//           return allkeys.reduce(function(acc, x){
//               return acc+((acc&&'\n')+x[0])
//           }, '');
//       };
//       // console.log('56 :', stringifyEntries(deepEntries(topModel))); 
//   };

//   reader.readAsText(e.target.files[0])
// }


// function deepEntries( obj ){//debugger;
//   'use-strict';
//   var allkeys, curKey = '[', len = 0, i = -1, entryK;

//   function formatKeys( entries ){
//      entryK = entries.length;
//      len += entries.length;
//      while (entryK--)
//        entries[entryK][0] = curKey+JSON.stringify(entries[entryK][0])+']';
//      return entries;
//   }
//   allkeys = formatKeys( Object.entries(obj) );

//   while (++i !== len)
//       if (typeof allkeys[i][1] === 'object' && allkeys[i][1] !== null){
//           curKey = allkeys[i][0] + '[';
//           Array.prototype.push.apply(
//               allkeys,
//               formatKeys( Object.entries(allkeys[i][1]) )
//           );
//       }
//   return allkeys;
// }
// function stringifyEntries(allkeys){
//   return allkeys.reduce(function(acc, x){
//       return acc+((acc&&'\n')+x[0])
//   }, '');
// };










// const topName = "json"
// const topModel = {
//     [topName]: {
//         id: topName+osduMod.title,
//         name: osduMod.title,
//         ...osduMod
//     }
// } // top object is given topName as key 
// console.log('27', topModel);