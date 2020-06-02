import { NextApiRequest, NextApiResponse } from 'next';
// import  fs  from 'fs';
// import typeDefs from '../../typeDefs';
// import GenGqlSchemas from '../../../../components/gql/GenGqlSchemas'
// import { connect, useSelector } from 'react-redux';
// import index from '../../../index'


async function getSchemaById(req: NextApiRequest, res: NextApiResponse) {

  // const state = useSelector((state: any) => state)
  // console.log('11', state
  // );
  
  // console.log('10', 
  //   GenGqlSchemas()
  // );
  // const mmName = 'MetamodelAMAP'
  // const version = '1'
  // fs.writeFileSync('/tmp/test-sync', 'Hey there!');
  // fs.writeFileSync(`./public/gql/schemas/current-typeDefs.js`, '{"schema":"import { gql } from \'apollo-server-micro\'\r\n\r\nconst typeDefs = gql`\r\n  type People {\r\n    id: String!\r\n    name: String!\r\n    email: String!\r\n    session: String\r\n  }\r\n  type Query {\r\n    allPeople: [People]\r\n\r\n  }\r\n`\r\n\r\nexport default typeDefs"}')
  // // fs.writeFileSync(`./public/gql/schemas/${mmName}-v${version}-typeDefs.js`, '{"schema":"import { gql } from \'apollo-server-micro\'\r\n\r\nconst typeDefs = gql`\r\n  type People {\r\n    id: String!\r\n    name: String!\r\n    email: String!\r\n    session: String\r\n  }\r\n  type Query {\r\n    allPeople: [People]\r\n\r\n  }\r\n`\r\n\r\nexport default typeDefs"}')
  // fs.writeFileSync(`./public/gql/schemas/current-typeDefs.js`, data)
  // const file = fs.readFileSync('./public/gql/typeDefs.js', 'utf8')
  // const text = {schema: file}
  // console.log('25', text);
  

  // res.json(text);
} 

export default getSchemaById





// import { NextApiRequest, NextApiResponse } from 'next';
// import sqlite from 'sqlite';

// export default async function getSchemaById(req: NextApiRequest, res: NextApiResponse) {
//   const db = await sqlite.open('./mydb.sqlite');
//   const usersession = await db.get('select * from usersession where id = ?', [req.query.id]);
//   res.json(usersession);
// } 