/// @ts-nocheck

import fs from 'fs';

const GenGqlSchemas = (ph) => {

  // const state = useSelector((state: any) => state) // Selecting the whole redux store
  const metis = (ph.phData) && ph.phData.metis
  const models = (metis) && metis.models  // selecting the models array
  const metamodels = (metis) && metis.metamodels
  console.log('11 gengql',  ph);

  // const focusModel = useSelector(focusModel => state.phFocus.focusModel)
  // const focusModelview = useSelector(focusModelview => state.phFocus.focusModelview)

  console.log('16', models);
  const selectedModelId = ph.phFocus.focusModel.id
  // const selectedModelId = "c2e472e5-a414-4899-8216-1511109219dd"
  console.log('19', selectedModelId);
  
  console.log('21', models?.find((m: any) => (m) && m.id === selectedModelId));

  const currentModel = (models) && models?.find((m: any) => (m) && m.id === selectedModelId)// sf test solution model
  console.log('22 currentModel', currentModel?.name, currentModel?.metamodelRef);

  const currentMetamodel = (metamodels) && metamodels?.find((mm: any) => mm.id === currentModel?.metamodelRef)
  const mm = currentMetamodel
  console.log('mm', mm);

  // * make the graphql type definition variable as an export default ` type, Query, Mutation ` * //
  const typeDefsWithCommas = mm &&
    '// "id" = "' + mm.id + '", "name" = "' + mm.name + '",\n ' +
    'export default `\n' +
    ((mm && mm.objecttypes) && mm.objecttypes?.map((mmo: any) => mmo && (
      '   type ' + mmo.name.replace(/ /g, "_") + ' { \n' +
      '     id : String! \n' +
      '     name : String! \n     ' +
      ((mmo && mmo.properties) ? mmo.properties?.map((p: any) => (p) && (
        (p.name) && (p.name.replace(/ /g, "_") + ': String \n     ')
      )) : '') + '' +
      ((mm && mm.relshiptypes) && mm.relshiptype?.map((mmr: any) => mmr && (
        (mmr.fromobjtypeRef === mmo.id) && (
          // '' + mmr.name.replace(/ /g, "_") +
          //  mmr.id.replace(/-/g, "_") +
          '' + mm.objecttypes.find((ot: { id: String; }) => (ot.id === mmr.toobjtypeRef)).name.replace(/ /g, "_") +
          // (mmr.name === 'Parts') ?
          's: [' + mm.objecttypes.find((ot: { id: String; }) => (ot.id === mmr.toobjtypeRef)).name.replace(/ /g, "_") + '] \n     '
          // : ': ' + mm.objecttypes.find((ot: { id: String; }) => (ot.id === mmr.toobjtypeRef)).name.replace(/ /g, "_") + ' \n     ' 
        )
      )) + '   \n').replace(/ys:/, "ies:").replace(/sss:/, "sses:")
      + '   } \n'
    ))) + '' +
    'type Query { \n' +
    ((mm && mm.objecttypes) && mm.objecttypes.map((mmo: any) => mmo && (
      '   all' + mmo.name.replace(/ /g, "_") + 's: [' + mmo.name.replace(/ /g, "_") + '] \n' +
      '   get' + mmo.name.replace(/ /g, "_") + '(id: String!): ' + mmo.name.replace(/ /g, "_") + ' \n\n'
    ).replace(/ys:/, "ies:").replace(/sss:/, "sses:"))) + '   } \n' +
    'type Mutation { \n' +
    ((mm && mm.objecttypes) && mm.objecttypes.map((mmo: any) => mmo && (
      '   create' + mmo.name.replace(/ /g, "_") + '(id: String!): ' + mmo.name.replace(/ /g, "_") + ' \n' +
      '   update' + mmo.name.replace(/ /g, "_") + '(id: String!, newId: String!): String \n' +
      '   delete' + mmo.name.replace(/ /g, "_") + '(id: String!): String \n\n'
    ))) + '   }\n`; \n\n\n'

  const resolversWithCommas = mm &&
    'export default { \n' +
    // Well: {
    //       },
    '  Query: { \n' +
    ((mm && mm.objecttypes) && mm.objecttypes.map((mmo: any) => mmo && (
      '   all' + mmo.name.replace(/ /g, "_") + 's: (parent:any@comma args:any@comma { models }:any) => { \n' +
      '       const objs = models.type(\"' + mmo.name.replace(/ /g, "_") + '\") \n' +
      '       return objs \n   }@comma \n').replace(/ys:/, "ies:").replace(/sss:/, "sses:"))) +
    '  }@comma \n' +
    '  Mutation: { \n' +
    '  } \n' +
    '} \n'

  const typeDefs = typeDefsWithCommas?.replace(/,/g, '').replace(/false/g, '').replace(/@comma/g, ',');
  const resolvers = resolversWithCommas?.replace(/,/g, '').replace(/false/g, '').replace(/@comma/g, ',');
  const defs = typeDefs + '\n\n\n' + resolvers
  const data = {gql:{id: mm?.id, name: mm?.name, typeDefs: typeDefs, resolvers: resolvers}}
  console.log('90', data);
  
  // async function putGqlSchemaById(
  //   req: NextApiRequest,
  //   res: NextApiResponse
  // ) {

  const url = `http://localhost:4050/api/gqlschema/current`
     fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
      // body: JSON.stringify({ name: '2nd Session', focus: '{"phData": "snorres test3"}' })
    });
  // }
  //   putGqlSchemaById(data)   
  return  data.name
}

export default GenGqlSchemas  

// export default Page(connect(state => state)(page));
// //* writeFile async   
// fls.writeFile('src/gql/test.ts', typeDefsJson1, function (err, data) {
//   if (err) {
//     return console.log(err);
//   }
//   //done
//   console.log(data);
// });
