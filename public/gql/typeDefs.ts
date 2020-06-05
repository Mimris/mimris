// "id" = "1fb28d16-ccd2-4538-6469-00e5315efcd8" "name" = "EKA Metamodel"
 export default `
   type Role { 
     id : String! 
     name : String! 
     undefined   
   } 
   type Task { 
     id : String! 
     name : String! 
     undefined   
   } 
   type Person { 
     id : String! 
     name : String! 
     undefined   
   } 
   type Value { 
     id : String! 
     name : String! 
     undefined   
   } 
   type Rule { 
     id : String! 
     name : String! 
     undefined   
   } 
   type Information { 
     id : String! 
     name : String! 
     undefined   
   } 
   type Property { 
     id : String! 
     name : String! 
     undefined   
   } 
   type Event { 
     id : String! 
     name : String! 
     undefined   
   } 
   type EKA_Object { 
     id : String! 
     name : String! 
     undefined   
   } 
   type Datatype { 
     id : String! 
     name : String! 
     undefined   
   } 
   type Decision { 
     id : String! 
     name : String! 
     undefined   
   } 
   type EKA_Space { 
     id : String! 
     name : String! 
     undefined   
   } 
   type EKA_Element { 
     id : String! 
     name : String! 
     undefined   
   } 
   type Unittype { 
     id : String! 
     name : String! 
     undefined   
   } 
type Query { 
   allRoles: [Role] 
   getRole(id: String!): Role 

   allTasks: [Task] 
   getTask(id: String!): Task 

   allPersons: [Person] 
   getPerson(id: String!): Person 

   allValues: [Value] 
   getValue(id: String!): Value 

   allRules: [Rule] 
   getRule(id: String!): Rule 

   allInformations: [Information] 
   getInformation(id: String!): Information 

   allProperties: [Property] 
   getProperty(id: String!): Property 

   allEvents: [Event] 
   getEvent(id: String!): Event 

   allEKA_Objects: [EKA_Object] 
   getEKA_Object(id: String!): EKA_Object 

   allDatatypes: [Datatype] 
   getDatatype(id: String!): Datatype 

   allDecisions: [Decision] 
   getDecision(id: String!): Decision 

   allEKA_Spaces: [EKA_Space] 
   getEKA_Space(id: String!): EKA_Space 

   allEKA_Elements: [EKA_Element] 
   getEKA_Element(id: String!): EKA_Element 

   allUnittypes: [Unittype] 
   getUnittype(id: String!): Unittype 

   } 
type Mutation { 
   createRole(id: String!): Role 
   updateRole(id: String! newId: String!): String 
   deleteRole(id: String!): String 

   createTask(id: String!): Task 
   updateTask(id: String! newId: String!): String 
   deleteTask(id: String!): String 

   createPerson(id: String!): Person 
   updatePerson(id: String! newId: String!): String 
   deletePerson(id: String!): String 

   createValue(id: String!): Value 
   updateValue(id: String! newId: String!): String 
   deleteValue(id: String!): String 

   createRule(id: String!): Rule 
   updateRule(id: String! newId: String!): String 
   deleteRule(id: String!): String 

   createInformation(id: String!): Information 
   updateInformation(id: String! newId: String!): String 
   deleteInformation(id: String!): String 

   createProperty(id: String!): Property 
   updateProperty(id: String! newId: String!): String 
   deleteProperty(id: String!): String 

   createEvent(id: String!): Event 
   updateEvent(id: String! newId: String!): String 
   deleteEvent(id: String!): String 

   createEKA_Object(id: String!): EKA_Object 
   updateEKA_Object(id: String! newId: String!): String 
   deleteEKA_Object(id: String!): String 

   createDatatype(id: String!): Datatype 
   updateDatatype(id: String! newId: String!): String 
   deleteDatatype(id: String!): String 

   createDecision(id: String!): Decision 
   updateDecision(id: String! newId: String!): String 
   deleteDecision(id: String!): String 

   createEKA_Space(id: String!): EKA_Space 
   updateEKA_Space(id: String! newId: String!): String 
   deleteEKA_Space(id: String!): String 

   createEKA_Element(id: String!): EKA_Element 
   updateEKA_Element(id: String! newId: String!): String 
   deleteEKA_Element(id: String!): String 

   createUnittype(id: String!): Unittype 
   updateUnittype(id: String! newId: String!): String 
   deleteUnittype(id: String!): String 

   }
`; 


