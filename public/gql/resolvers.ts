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
   allPersons: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Person") 
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
   allEKA_Objects: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("EKA_Object") 
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
   allEKA_Spaces: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("EKA_Space") 
       return objs 
   }, 
   allEKA_Elements: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("EKA_Element") 
       return objs 
   }, 
   allUnittypes: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Unittype") 
       return objs 
   }, 
  }, 
  Mutation: { 
  } 
} 
