// "id" = "91771993-21a0-4e63-7746-9aedbb747045" "name" = "SF test target Metamodel"
 export default `
   type address { 
     id : String! 
     name : String! 
     suite: String 
     zipcode: String 
     city: String 
     street: String 
        
   } 
   type Role { 
     id : String! 
     name : String! 
     Tasks: [Task] 
        
   } 
   type Task { 
     id : String! 
     name : String! 
     Approved: String 
     Repetitive: String 
     Status: String 
     Start: String 
     End: String 
     Trajectories: [Trajectory] 
     Wells: [Well] 
     Users: [User] 
        
   } 
   type User { 
     id : String! 
     name : String! 
     adresse: String 
     email: String 
     username: String 
     Property: String 
     addresses: [address] 
        
   } 
   type Trajectory { 
     id : String! 
     name : String! 
     Length: String 
        
   } 
   type Property { 
     id : String! 
     name : String! 
        
   } 
   type Well { 
     id : String! 
     name : String! 
     Depth: String 
     Name: String 
     Trajectories: [Trajectory] 
        
   } 
type Query { 
   alladdresses: [address] 
   getaddress(id: String!): address 

   allRoles: [Role] 
   getRole(id: String!): Role 

   allTasks: [Task] 
   getTask(id: String!): Task 

   allUsers: [User] 
   getUser(id: String!): User 

   allTrajectories: [Trajectory] 
   getTrajectory(id: String!): Trajectory 

   allProperties: [Property] 
   getProperty(id: String!): Property 

   allWells: [Well] 
   getWell(id: String!): Well 

   } 
type Mutation { 
   createaddress(id: String!): address 
   updateaddress(id: String! newId: String!): String 
   deleteaddress(id: String!): String 

   createRole(id: String!): Role 
   updateRole(id: String! newId: String!): String 
   deleteRole(id: String!): String 

   createTask(id: String!): Task 
   updateTask(id: String! newId: String!): String 
   deleteTask(id: String!): String 

   createUser(id: String!): User 
   updateUser(id: String! newId: String!): String 
   deleteUser(id: String!): String 

   createTrajectory(id: String!): Trajectory 
   updateTrajectory(id: String! newId: String!): String 
   deleteTrajectory(id: String!): String 

   createProperty(id: String!): Property 
   updateProperty(id: String! newId: String!): String 
   deleteProperty(id: String!): String 

   createWell(id: String!): Well 
   updateWell(id: String! newId: String!): String 
   deleteWell(id: String!): String 

   }
`; 


