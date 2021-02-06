// "id" = "1fb28d16-ccd2-4538-6469-00e5315efcd8" "name" = "IRTV Metamodel"
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
   type Query { 
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
   type Condition { 
     id : String! 
     name : String! 
     undefined   
   } 
   type View { 
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
   type Container { 
     id : String! 
     name : String! 
     undefined   
   } 
   type Object { 
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
   type Space { 
     id : String! 
     name : String! 
     undefined   
   } 
   type Element { 
     id : String! 
     name : String! 
     undefined   
   } 
   type Unittype { 
     id : String! 
     name : String! 
     undefined   
   } 
   type Generic { 
     id : String! 
     name : String! 
     undefined   
   } 
   type ViewFormat { 
     id : String! 
     name : String! 
     undefined   
   } 
   type InputPattern { 
     id : String! 
     name : String! 
     undefined   
   } 
type Query { 
   allRoles: [Role] 
   getRole(id: String!): Role 

   allTasks: [Task] 
   getTask(id: String!): Task 

   allQueries: [Query] 
   getQuery(id: String!): Query 

   allValues: [Value] 
   getValue(id: String!): Value 

   allRules: [Rule] 
   getRule(id: String!): Rule 

   allConditions: [Condition] 
   getCondition(id: String!): Condition 

   allViews: [View] 
   getView(id: String!): View 

   allInformations: [Information] 
   getInformation(id: String!): Information 

   allProperties: [Property] 
   getProperty(id: String!): Property 

   allEvents: [Event] 
   getEvent(id: String!): Event 

   allContainers: [Container] 
   getContainer(id: String!): Container 

   allObjects: [Object] 
   getObject(id: String!): Object 

   allDatatypes: [Datatype] 
   getDatatype(id: String!): Datatype 

   allDecisions: [Decision] 
   getDecision(id: String!): Decision 

   allSpaces: [Space] 
   getSpace(id: String!): Space 

   allElements: [Element] 
   getElement(id: String!): Element 

   allUnittypes: [Unittype] 
   getUnittype(id: String!): Unittype 

   allGenerics: [Generic] 
   getGeneric(id: String!): Generic 

   allViewFormats: [ViewFormat] 
   getViewFormat(id: String!): ViewFormat 

   allInputPatterns: [InputPattern] 
   getInputPattern(id: String!): InputPattern 

   } 
type Mutation { 
   createRole(id: String!): Role 
   updateRole(id: String! newId: String!): String 
   deleteRole(id: String!): String 

   createTask(id: String!): Task 
   updateTask(id: String! newId: String!): String 
   deleteTask(id: String!): String 

   createQuery(id: String!): Query 
   updateQuery(id: String! newId: String!): String 
   deleteQuery(id: String!): String 

   createValue(id: String!): Value 
   updateValue(id: String! newId: String!): String 
   deleteValue(id: String!): String 

   createRule(id: String!): Rule 
   updateRule(id: String! newId: String!): String 
   deleteRule(id: String!): String 

   createCondition(id: String!): Condition 
   updateCondition(id: String! newId: String!): String 
   deleteCondition(id: String!): String 

   createView(id: String!): View 
   updateView(id: String! newId: String!): String 
   deleteView(id: String!): String 

   createInformation(id: String!): Information 
   updateInformation(id: String! newId: String!): String 
   deleteInformation(id: String!): String 

   createProperty(id: String!): Property 
   updateProperty(id: String! newId: String!): String 
   deleteProperty(id: String!): String 

   createEvent(id: String!): Event 
   updateEvent(id: String! newId: String!): String 
   deleteEvent(id: String!): String 

   createContainer(id: String!): Container 
   updateContainer(id: String! newId: String!): String 
   deleteContainer(id: String!): String 

   createObject(id: String!): Object 
   updateObject(id: String! newId: String!): String 
   deleteObject(id: String!): String 

   createDatatype(id: String!): Datatype 
   updateDatatype(id: String! newId: String!): String 
   deleteDatatype(id: String!): String 

   createDecision(id: String!): Decision 
   updateDecision(id: String! newId: String!): String 
   deleteDecision(id: String!): String 

   createSpace(id: String!): Space 
   updateSpace(id: String! newId: String!): String 
   deleteSpace(id: String!): String 

   createElement(id: String!): Element 
   updateElement(id: String! newId: String!): String 
   deleteElement(id: String!): String 

   createUnittype(id: String!): Unittype 
   updateUnittype(id: String! newId: String!): String 
   deleteUnittype(id: String!): String 

   createGeneric(id: String!): Generic 
   updateGeneric(id: String! newId: String!): String 
   deleteGeneric(id: String!): String 

   createViewFormat(id: String!): ViewFormat 
   updateViewFormat(id: String! newId: String!): String 
   deleteViewFormat(id: String!): String 

   createInputPattern(id: String!): InputPattern 
   updateInputPattern(id: String! newId: String!): String 
   deleteInputPattern(id: String!): String 

   }
`; 


