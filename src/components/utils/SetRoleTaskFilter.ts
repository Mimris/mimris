const debug = false;

import { useDispatch } from "react-redux";
import { Dispatch } from "redux";

const genRoleTasks = (mmodel, dispatch: Dispatch<any>) => {
    // const dispatch = dispatch
    // const mmodel = mmodel?.mmodel;

    if (debug) console.log("7 genRoleTasks",  mmodel);
    if (debug) console.log("11 genRoleTasks", mmodel.objecttypes0, mmodel.objecttypes);
    if (mmodel?.objecttypes0) {
        const  oTypes0 = mmodel?.objecttypes0?.map((ot: { id: any; name: any; description: any; icon: any; color: any; type: any; }) => {
        return {id: ot.id, name: ot.name, description: ot.description, icon: ot.icon, color: ot.color, type: ot.type}
        })

        const oTypes = mmodel?.objecttypes?.map((ot: { id: any; name: any; description: any; icon: any; color: any; type: any; }) => {
            return {id: ot.id, name: ot.name, description: ot.description, icon: ot.icon, color: ot.color, type: ot.type}
        }
        )
        // if (debug) console.log("21  oTyp", oTypes, oTypes0);
        // console.log('22 ', JSON.stringify(oTypes.map( t => {return t.name})))

        const datarole = (oTypes0) && {
            focusRole: {
            id: "Modeller1",
            name: "Modeller 1",
            tasks: [
                {
                    id: "task00",
                    name: "All types",
                    description: "All types modelling",
                    workOnTypes:  [
                        "Container",    
                        "EntityType",
                        "Information",
                        "Role",
                        "Task",
                        "View",
                            ...oTypes?.map((t: { name: any; }) => 
                                (t.name !== "Container") &&
                                (t.name !== "EntityType") &&
                                (t.name !== "Information") &&
                                (t.name !== "Role") &&
                                (t.name !== "Task") &&
                                (t.name !== "View")
                                && t.name)
                    ]
                },
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
                            ...oTypes0?.map((t: { name: any; }) => 
                                (t.name !== "Container") &&
                                (t.name !== "EntityType") &&
                                (t.name !== "Information") &&
                                (t.name !== "Role") &&
                                (t.name !== "Task") &&
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
                }
            ]
        }
        }
        
        if (oTypes0) dispatch({ type: 'SET_FOCUS_ROLE', data: datarole.focusRole })

        let datatask = (oTypes0?.length > 0) ? {
                focusTask: {
                id: "Task4",  
                name: "Modelling",
                description: "Modelling",
                workOnTypes: [
                    "Container",
                    "EntityType",
                    "Information",
                    "Role",
                    "Task",
                    "View",
                    "Label",
                    ...oTypes0?.map((t: { name: any; }) => 
                        (t.name !== "Container") &&
                        (t.name !== "EntityType") &&
                        (t.name !== "Information") &&
                        (t.name !== "Role") &&
                        (t.name !== "Task") &&
                        (t.name !== "View") &&
                        (t.name !== "Label")
                        && t.name)
                ]
                // .concat(...oTypes0?.map((t: { name: any; }) => t.name))
                }
            } : 
            {
                focusTask: {
                    id: "Task4",
                    name: "All types",
                    description: "All types modelling",
                    workOnTypes: [
                        "Container",
                        "EntityType",
                        "Information",
                        "Role",
                        "Task",
                        "View",
                        "Label",
                        ...oTypes?.map((t: { name: any; }) => 
                            (t.name !== "Container") &&
                            (t.name !== "EntityType") &&
                            (t.name !== "Information") &&
                            (t.name !== "Role") &&
                            (t.name !== "Task") &&
                            (t.name !== "View") &&
                            (t.name !== "Label")
                            && t.name)
                    ]
                }
            }

        if (debug) console.log("105 genDataTasks", datatask);
        dispatch({ type: 'SET_FOCUS_TASK', data: datatask.focusTask })
    }
 }
export default genRoleTasks;