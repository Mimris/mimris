const debug = false;

import { useDispatch } from "react-redux";
import { Dispatch } from "redux";

const genRoleTasks = (role, task, types, mmodel, dispatch: Dispatch<any>) => {
    // const dispatch = dispatch
    // const mmodel = mmodel?.mmodel;

    if (debug) console.log("7 genRoleTasks", role, task, types, mmodel);
    if (debug) console.log("11 genRoleTasks", mmodel.objecttypes0, mmodel.objecttypes);
    if (mmodel?.objecttypes0?.length > 0) {
        const  oTypes0 = mmodel?.objecttypes0?.map((ot: { id: any; name: any; description: any; icon: any; color: any; type: any; }) => {
            return {id: ot.id, name: ot.name, description: ot.description, icon: ot.icon, color: ot.color, type: ot.type}
        })

        const oTypes = mmodel?.objecttypes?.map((ot: { id: any; name: any; description: any; icon: any; color: any; type: any; }) => {
            return {id: ot.id, name: ot.name, description: ot.description, icon: ot.icon, color: ot.color, type: ot.type}
        }
        )
        if (debug) console.log("21  oTyp", oTypes, oTypes0);
        // console.log('22 ', JSON.stringify(oTypes.map( t => {return t.name})))
        // sort oTypes
        const oTypesSorted = oTypes.sort((a: { name: string; }, b: { name: string; }) => (a.name > b.name) ? 1 : -1)

        const datarole = (oTypes0.length > 0) && {
            focusRole: {
            id: "Modeller1",
            name: "Modeller 1",
            tasks: [
                {
                    id: "IRTV-POPS++",
                    name: "IRTV-POPS++",
                    description: "Model IRTV-POPS++ objects",
                    workOnTypes: [
                    "Container",   
                    "EntityType",
                    "Information",
                    "Role",
                    "Task",
                    "View",
                    "Label",
                    "Product",
                    "Organisation",
                    "Process",
                    "System",   
                    ]
                },
                {
                    id: "All-types",
                    name: "All Objecttypes",
                    description: "All Objecttypes modelling",
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
                    id: "IRTV+New-types",
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
                    id: "Property",
                    name: "Property Modelling",
                    description: "Create New Entity using objecttype: EntityType and add properties",
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
        if (debug) console.log("114 datarole", oTypes0, datarole);
        
        const foundRole = datarole?.focusRole
        const foundTask = datarole?.focusRole?.tasks?.find((t: { id: any; }) => t.id === task && t) || datarole?.focusRole?.tasks[0]

        if (oTypes0.length > 0) dispatch({ type: 'SET_FOCUS_ROLE', data: foundRole })

        let datatask = {
            tasks: [
                {
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
                        "Property",
                        "Generic",
                        "Label",
                        ...oTypesSorted?.map((t: { name: any; }) => 
                            (t.name !== "Container") &&
                            (t.name !== "EntityType") &&
                            (t.name !== "Information") &&
                            (t.name !== "Role") &&
                            (t.name !== "Task") &&
                            (t.name !== "View") &&
                            (t.name !== "Label") &&
                            (t.name !== "Property") &&
                            (t.name !== "Generic") &&
                            (t.name !== "Datatype") &&
                            (t.name !== "InputPattern") &&
                            (t.name !== "FieldType") &&
                            (t.name !== "Unittype") &&
                            (t.name !== "Value") &&
                            (t.name !== "ViewFormat") &&
                            (t.name !== "Method") &&
                            (t.name !== "MethodType") &&
                            (t.name !== "View") &&
                            (t.name !== "RelshipType") &&
                            (t.name !== "ExclusiveGate") &&
                            (t.name !== "Process") &&
                            (t.name !== "Function") &&
                            (t.name !== "Activity") &&
                            (t.name !== "Start") &&
                            (t.name !== "End") &&
                            (t.name !== "ExclusiveGate") &&
                            (t.name !== "InclusiveGate") &&
                            (t.name !== "ParallelGate")
                            && t.name).filter(Boolean),
                            "Process",
                            "Function",
                            "Activity",
                            "Start",
                            "End",
                            "ExclusiveGate",
                            "InclusiveGate",
                            "ParallelGate",
                            "Datatype",
                            "InputPattern",
                            "FieldType",
                            "Unittype",
                            "Value",
                            "ViewFormat",
                            "Method",
                            "MethodType",
                            "RelshipType"
                    ]
                },
            ]
        }
    
         
        // const foundTask = datatask.tasks.find((t: { id: any; }) => t.id === task) || datatask.tasks[0]
        if (debug) console.log("187 focusTasks", datatask);
        if (datatask) dispatch({ type: 'SET_FOCUS_TASK', data: datatask.tasks })
        if (types?.length < 1) types = datatask.tasks[0].workOnTypes

        const tmptasks =datarole.focusRole.tasks.map((t: { id: any; name: any; }) => {return {id: t.id, name: t.name}})
        
        if (debug) console.log("196 focusTasks",  foundRole, foundTask, tmptasks, foundTask.workOnTypes);

        return { // return just id and name and arrays of ids and names
            filterRole: {id: foundRole.id, name: foundRole.name},
            filterTask: {id: foundTask.id, name: foundTask.name},
            filterTasks: tmptasks,
            filterTypes: foundTask.workOnTypes
        }
    }
}
export default genRoleTasks;