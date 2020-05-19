import { gql } from 'apollo-server-micro'

const typeDefs = gql`
  type People {
    id: String!
    name: String!
    email: String!
    session: String
  }
  type Query {
    allPeople: [People]

  }
`

export default typeDefs