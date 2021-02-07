export default { 
  Query: { 
   allRoles: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Role") 
       return objs 
   }, 
   allTasks: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Task") 
       return objs 
   }, 
   allQueries: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Query") 
       return objs 
   }, 
   allValues: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Value") 
       return objs 
   }, 
   allRules: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Rule") 
       return objs 
   }, 
   allConditions: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Condition") 
       return objs 
   }, 
   allViews: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("View") 
       return objs 
   }, 
   allInformations: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Information") 
       return objs 
   }, 
   allProperties: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Property") 
       return objs 
   }, 
   allEvents: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Event") 
       return objs 
   }, 
   allContainers: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Container") 
       return objs 
   }, 
   allObjects: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Object") 
       return objs 
   }, 
   allDatatypes: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Datatype") 
       return objs 
   }, 
   allDecisions: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Decision") 
       return objs 
   }, 
   allSpaces: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Space") 
       return objs 
   }, 
   allElements: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Element") 
       return objs 
   }, 
   allUnittypes: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Unittype") 
       return objs 
   }, 
   allGenerics: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Generic") 
       return objs 
   }, 
   allViewFormats: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("ViewFormat") 
       return objs 
   }, 
   allInputPatterns: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("InputPattern") 
       return objs 
   }, 
  }, 
  Mutation: { 
  } 
} 
