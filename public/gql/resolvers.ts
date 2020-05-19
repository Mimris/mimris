export default { 
  Query: { 
   alladdresses: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("address") 
       return objs 
   }, 
   allRoles: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Role") 
       return objs 
   }, 
   allTasks: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Task") 
       return objs 
   }, 
   allUsers: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("User") 
       return objs 
   }, 
   allTrajectories: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Trajectory") 
       return objs 
   }, 
   allProperties: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Property") 
       return objs 
   }, 
   allWells: (parent:any, args:any, { models }:any) => { 
       const objs = models.type("Well") 
       return objs 
   }, 
  }, 
  Mutation: { 
  } 
} 
