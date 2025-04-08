// import { ApolloServer } from "@apollo/server";
// // import { ApolloServer, gql } from "apollo-server-micro";
// import Cors from "micro-cors";

// // import resolvers from '../../../../public/gql/resolvers'
// import typeDefs from '../../../../public/gql/typeDefs'
// import * as models  from '../../../components/gql/models';

// const resolvers = {
//   Query: {
//     allUsers: (parent: any, args: any, { models }: any) => {
//       const objs = models.type("User")
//       return objs 
//       // return (
//       //   [{
//       //     id: '1',
//       //     name: 'snorre'
//       //   }]
//       //   )
//   }
//       // id: (user, _args, _context) => '1',
//       // name: (user, args, _context) => 'snorre'
// }
// };

// const cors = Cors({
//   allowMethods: ["GET", "POST", "OPTIONS"]
// });

// const apolloServer = new ApolloServer({
//   typeDefs,
//   resolvers,
//   context: () => {
//     return { models };
//   }
// });

// const handler = apolloServer.createHandler({ path: "/api/graphql" });

// export const config = {
//   api: {
//     bodyParser: false
//   }
// };

// export default cors(handler);

export {}























// import { ApolloServer } from 'apollo-server-micro'
// import resolvers from '../../../../public/gql/resolvers'
// import typeDefs from '../../../../public/gql/typeDefs'
// // import * as models from '../../../../../Server/src/gql/models';

// const apolloServer = new ApolloServer({
//   typeDefs,
//   resolvers,
//   context: () => {
//   //   console.log('9', models);
    
//   //   // Note! This example uses the `req` object to access headers,
//   //   // but the arguments received by `context` vary by integration.
//   //   // This means they will vary for Express, Koa, Lambda, etc.!
//   //   //
//   //   // To find out the correct arguments for a specific integration,
//   //   // see the `context` option in the API reference for `apollo-server`:
//   //   // https://www.apollographql.com/docs/apollo-server/api/apollo-server/

//   //   // Get the user token from the headers.
//   //   // const token = req.headers.authorization || '';

//   //   // try to retrieve a user with the token
//   //   // const type = async (otype: any) => {
//   //   const items = async function getUser() {
//   //     let response = await fetch('https://jsonplaceholder.typicode.com/users')
//   //     const users = await response.json()
//   //     return users  
//   //   }

//   //   // add the user to the context
//     // return { items };
//     console.log('33', models);
    
//     return { user: {id: '1', name: 'snorre'}};
//   },
// })

// const server = apolloServer.createHandler({ path: '/api/graphql' })

// export const config = {
//   api: {
//     bodyParser: false
//   }
// }

// export default server
export {}