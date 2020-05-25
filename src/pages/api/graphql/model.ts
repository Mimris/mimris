import { ApolloServer } from 'apollo-server-micro'
import resolvers from '../../../../public/gql/resolvers'
import typeDefs from '../../../../public/gql/typeDefs'

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers
})

const server = apolloServer.createHandler({ path: '/api/graphql' })

export const config = {
  api: {
    bodyParser: false
  }
}

export default server