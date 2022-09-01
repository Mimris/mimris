const debug = false;

import { useDispatch } from "react-redux";
import { Dispatch } from "redux";

const genRoleTasks = (mmodel, dispatch: Dispatch<any>) => {
    // const dispatch = dispatch
    // const mmodel = mmodel?.mmodel;

    if (debug) console.log("7 genRoleTasks",  mmodel.objecttypes0, mmodel.objecttypes, dispatch);
    
    const  oTypes0 = mmodel?.objecttypes0?.map((ot: { id: any; name: any; description: any; icon: any; color: any; type: any; }) => {
      return {id: ot.id, name: ot.name, description: ot.description, icon: ot.icon, color: ot.color, type: ot.type}
    })

    const oTypes = mmodel?.objecttypes?.map((ot: { id: any; name: any; description: any; icon: any; color: any; type: any; }) => {
        return {id: ot.id, name: ot.name, description: ot.description, icon: ot.icon, color: ot.color, type: ot.type}
    }
    )
    
      const datarole = {
        focusRole: {
          id: "Modeller1",
          name: "Modeller 1",
          tasks: [
            {
                id: "Task0",
                name: "Modelling",
                workOnTypes:  [
                    "Container",    
                    "EntityType",
                    "Information",
                    "Role",
                    "Task",
                    "View",
                    ... oTypes0?.map((t: { name: any; }) => 
                        (t.name !== "Container") ||
                        (t.name !== "EntityType") ||
                        (t.name !== "Information") ||
                        (t.name !== "Role") ||
                        (t.name !== "Task") ||
                        (t.name !== "View")
                        && t.name)
                ]
            },
            {
                id: "task1",
                name: "Entity Modelling",
                description: "Create New Entity using objecttype: EntityType",
                workOnTypes: [
                    "Container",   
                    "EntityType",
                    "Property",
                    "Datatype",
                    "Value",
                    "Method",
                    "ViewFormat",
                    "InputPattern",
                    "FieldType",
                    "Unittype"
                ]
            },
            {
                id: "task2",
                name: "Property Modelling",
                description: "Add property to EtityType definitions",
                workOnTypes: [
                "Container",   
                "EntityType",
                "Property",
                "Datatype"
                ]
            },
            {
                id: "task3",
                name: "Task Modelling",
                description: "Add property to EtityType definitions",
                workOnTypes: [
                "Container",    
                "EntityType",
                "Information",
                "Role",
                "Task",
                "View"
                ]
            },
            {
                id: "task4",
                name: "All types",
                description: "All types modelling",
                workOnTypes: [
                    oTypes.map((t: { name: any; }) => t.name)
                ]
            }
        ]
      }
    }
    
      dispatch({ type: 'SET_FOCUS_ROLE', data: datarole.focusRole })

      let datatask = (oTypes0?.length > 0) ? {
            focusTask: {
            id: "Task4",  
            name: "Modelling",
            description: "Modelling",
            workOnTypes:
            ["Container"].concat(...oTypes0?.map((t: { name: any; }) => t.name))
            }
        } : 
        {
            focusTask: {
                id: "Task4",
                name: "All types",
                description: "All types modelling",
                workOnTypes: [
                    ["Container"].concat(...oTypes?.map((t: { name: any; }) => t.name))
                ]
            }
        }

    if (debug) console.log("105 genRoleTasks", datatask);
    dispatch({ type: 'SET_FOCUS_TASK', data: datatask.focusTask })
 }
export default genRoleTasks;