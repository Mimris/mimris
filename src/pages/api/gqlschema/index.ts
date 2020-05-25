import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';

export default async function getSchemaById(
  req: NextApiRequest,
  res: NextApiResponse
) {

  
  if (req.method === 'PUT') { 
    console.log('11', req.query.id);
    if (req.query.id == 'current') {
        console.log('12', req.body);
        
          fs.writeFileSync(`./public/gql/typeDefs.ts`, req.body.gql.typeDefs)
          fs.writeFileSync(`./public/gql/resolvers.ts`, req.body.gql.resolvers)
      } else {
          const gqlmm = req.body
          // const mmId = gqlmm.gql.id
          const mmName = gqlmm.gql.name
          const version = '1'
          const defs = gqlmm.gql.defs
          console.log('22', defs);

          const nowtime = new Date().toJSON()
            .replace(/\//g, '-')
            .replace(/,/g, '.')
            .replace(/:/g, '.')
          //   undefined, {
          //   day: 'numeric',
          //   month: 'numeric',
          //   year: 'numeric',
          //   hour: '2-digit',
          //   minute: '2-digit',
          // })
          console.log('35', nowtime);

          // fs.writeFileSync(`public/gql/schemas/current-typeDefs.js`, result)
          fs.writeFileSync(`./public/gql/schemas/typeDefs-${nowtime}-${mmName}-v${version}.js`, defs)
      }
    }
    res.send('Gql Schemas generated')
  } 



    
    // const file = fs.readFileSync('./public/gql/typeDefs.js', 'utf8')
    // const text = { schema: file }
    // console.log('25', text);
    // res.send('file saved')






// import { NextApiRequest, NextApiResponse } from 'next';
// import sqlite from 'sqlite';

// export default async function getSchemaById(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   const db = await sqlite.open('./mydb.sqlite');

//   if (req.method === 'PUT') {
//     const statement = await db.prepare(
//       'UPDATE usersession SET name= ?, focus = ? where id = ?'
//     );
//     const result = await statement.run(
//       req.body.name,
//       req.body.focus,
//       req.query.id
//     );
//     result.finalize();
//   }

//   const usersession = await db.get('select * from usersession where id = ?', [
//     req.query.id
//   ]);
//   res.json(usersession);
// }
