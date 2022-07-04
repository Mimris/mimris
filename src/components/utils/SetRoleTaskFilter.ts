import { useDispatch } from "react-redux";
import { Dispatch } from "redux";

const genRoleTasks = (mmodel, dispatch: Dispatch<any>) => {
    // const dispatch = dispatch
    // const mmodel = mmodel?.mmodel;

    console.log("7 genRoleTasks",  mmodel.objecttypes0, mmodel.objecttypes, dispatch);
    
    const  oTypes0 = mmodel?.objecttypes0?.map((ot: { id: any; name: any; description: any; icon: any; color: any; type: any; }) => {
      return {id: ot.id, name: ot.name, description: ot.description, icon: ot.icon, color: ot.color, type: ot.type}
    })

    const oTypes = mmodel?.objecttypes?.map((ot: { id: any; name: any; description: any; icon: any; color: any; type: any; }) => {
        return {id: ot.id, name: ot.name, description: ot.description, icon: ot.icon, color: ot.color, type: ot.type}
    }
    )

    
      const datarole = {
        focusRole: {
          id: "Modeller2",
          name: "Modeller 2",
          tasks: [
            {
                id: "Task0",
                name: "Solution Modelling",
                workOnTypes:  
                oTypes0.map((t: { name: any; }) => t.name)
            },
            {
                id: "task1",
                name: "Entity Modelling",
                description: "Create New Entity using objecttype: EntityType",
                workOnTypes: [
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
                description: "All types",
                workOnTypes: [
                    oTypes.map((t: { name: any; }) => t.name)
                ]
            }
        ]
      }
    }
      dispatch({ type: 'SET_FOCUS_ROLE', data: datarole.focusRole })

      let datatask = (oTypes0.length > 0) ? {
            focusTask: {
            id: "Task2",  
            name: "Solution Modelling",
            workOnTypes:
            ["Container"].concat(...oTypes0.map((t: { name: any; }) => t.name))
            }
        } : 
        {
            focusTask: {
                id: "Task2",
                name: "Solution Modelling",
                workOnTypes: [
                    oTypes.map((t: { name: any; }) => t.name)
                ]
            }
        }

    console.log("105 genRoleTasks", datatask);
    dispatch({ type: 'SET_FOCUS_TASK', data: datatask.focusTask })
 }
export default genRoleTasks;