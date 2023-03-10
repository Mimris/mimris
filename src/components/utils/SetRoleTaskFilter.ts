const debug = false;

import { useDispatch } from "react-redux";
import { Dispatch } from "redux";

const genRoleTasks = (role, task, types, mmodel, dispatch: Dispatch<any>) => {
    // const dispatch = dispatch
    // const mmodel = mmodel?.mmodel;

    if (!debug) console.log("10 genRoleTasks", role, task, types, mmodel);
    if (debug) console.log("11 genRoleTasks", mmodel.objecttypes0, mmodel.objecttypes);
    let datarole, oTypes, oTypes0; 

    if (mmodel?.objecttypes0?.length > 0) {
         oTypes = mmodel?.objecttypes0?.map((ot: { id: any; name: any; description: any; icon: any; color: any; type: any; }) => {
            return {id: ot.id, name: ot.name, description: ot.description, icon: ot.icon, color: ot.color, type: ot.type}
        })
    } else {
        oTypes = mmodel?.objecttypes?.map((ot: { id: any; name: any; description: any; icon: any; color: any; type: any; }) => {
            return {id: ot.id, name: ot.name, description: ot.description, icon: ot.icon, color: ot.color, type: ot.type}
        })
    }

    if (debug) console.log("21  oTyp", oTypes, oTypes0);
    // console.log('22 ', JSON.stringify(oTypes.map( t => {return t.name})))
    // sort oTypes
    const oTypesSorted = oTypes.sort((a: { name: string; }, b: { name: string; }) => (a.name > b.name) ? 1 : -1)

    datarole = {
        focusRole: {
            id: "Modeller1",
            name: "Modeller 1",
            tasks: [
                {
                    id: "AKM-IRTV-POPS++_MM",
                    name: "AKM-IRTV-POPS++_MM",
                    description: "Modelling with AKM-IRTV-POPS++ objects",
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
                    "Activity",
                    "ParrallelGate",
                    "ExclusiveGate",
                    "InclusiveGate",
                    "Gateway",
                    "Start",
                    "End",
                    ]
                },
                {
                    id: "AKM-IRTV-POPS+_MM",
                    name: "AKM-IRTV-POPS+_MM",
                    description: "Modeling with AKM-IRTV-POPS+ objects",
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
                    "Activity",
                    "ParrallelGate",
                    "ExclusiveGate",
                    "InclusiveGate",
                    "Gateway",
                    "Start",
                    "End", 
                    ]
                },
                {
                    id: "AKM-IRTV-POPS_MM",
                    name: "AKM-IRTV-POPS_MM",
                    description: "Modeling with AKM-IRTV-POPS objects",
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
                    id: "AKM-IRTV-POPS_MM",
                    name: "AKM-IRTV-POPS_MM",
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
                    "System",   
                    ]
                },
                {
                    id: "IRTV",
                    name: "IRTV",
                    description: "Model IRTV objects",
                    workOnTypes: [
                    "Container",   
                    "EntityType",
                    "Information",
                    "Role",
                    "Task",
                    "View",
                    "Label",  
                    ]
                },
                {
                    id: "All-types",
                    name: "All Objecttypes",
                    description: "All Objecttypes in this  metamodel",
                    workOnTypes:  []
                },
                {
                    id: "IRTV+POPS+New-types",
                    name: "IRTV+POPS+New-types",
                    workOnTypes:  [
                        "Container",    
                        "EntityType",
                        "Information",
                        "Role",
                        "Task",
                        "View",
                        "Product",
                        "Organisation",
                        "Process",
                        "System",
                            ...oTypes?.map((t: { name: any; }) => 
                                (t.name !== "Container") &&
                                (t.name !== "EntityType") &&
                                (t.name !== "Information") &&
                                (t.name !== "Role") &&
                                (t.name !== "Task") &&
                                (t.name !== "View") &&
                                (t.name !== "Product") &&
                                (t.name !== "Organisation") &&
                                (t.name !== "Process") &&
                                (t.name !== "System")
                                && t.name)
                    ]
                },
                {
                    id: "AKM-CORE+_MM",
                    name: "AKM-CORE+_MM",
                    description: "AKM-CORE+_MM modelling",
                    workOnTypes: [
                        "Container",   
                        "EntityType",
                        "Property",
                        "Datatype",
                        "Value",
                        "Method",
                        "MethodType",
                        "ViewFormat",
                        "InputPattern",
                        "FieldType",
                        "RelshipType",
                        "Generic",
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
                    id: "IRTV+New-types",  
                    name: "IRTV + New types",
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
    }
    
    if (debug) console.log("114 datarole", oTypes, datarole);
    
    const foundRole = datarole?.focusRole
    const foundTask = foundRole?.tasks?.find((t) =>  t.id === task.id) || null
    const foundMMTask = foundRole?.tasks?.find((t) =>  t.id === mmodel.name) || null
    const foundIRTVTask = foundRole?.tasks?.find((t) =>  (mmodel.id.includes("IRTV")) && t) || null
    const foundPOPSTask = foundRole?.tasks?.find((t) =>  (mmodel.id.includes("POPS")) && t) || null
    const foundPropertyType = mmodel.objecttypes.find(ot => (ot.name === "Property") && ot) || null
    if (debug) console.log("278 found...Types", foundPropertyType)
    const mmtask = (foundMMTask) && datarole.focusRole.tasks.find(t => t.id.includes(mmodel.name) && [{id: t.id, name: t.name}])
    const popstask = (foundPOPSTask) && datarole.focusRole.tasks.find(t => t.id.includes("IRTV+POPS") && [{id: t.id, name: t.name}])
    const irtvtask = (foundIRTVTask) && datarole.focusRole.tasks.find(t => t.id.includes("IRTV") && [{id: t.id, name: t.name}])
    const propstask = (foundPropertyType) && datarole.focusRole.tasks.find(t => t.id.includes("Property") && [{id: t.id, name: t.name}])
    const alltask =  datarole.focusRole.tasks.find(t => t.id.includes("All-types") && [{id: t.id, name: t.name}])
    if (debug) console.log('247 ', mmtask, popstask, irtvtask, propstask, alltask)

    if (debug) console.log("240 filteredTasks", alltask);

    if (debug) console.log("206 filteredTasks", mmodel.name, foundMMTask, foundIRTVTask, foundPOPSTask, foundPropertyTask, foundRole.tasks[0]);
    // const foundTask = (foundMMTask) ? foundMMTask : foundRole.tasks[0]
    // const foundTask = (foundMMTask) ? foundMMTask : foundRole.tasks[0]
    const foundTypes = foundTask?.workOnTypes || []

    if (oTypes.length > 0) dispatch({ type: 'SET_FOCUS_ROLE', data: foundRole })
    if (foundTask) dispatch({ type: 'SET_FOCUS_TASK', data: foundTask })

    const tmptasks = datarole.focusRole.tasks.filter((t: { id: any; name: any; }) => {return (t.id === foundMMTask?.id) && {id: t.id, name: t.name}})
    const foundtasks = [ mmtask, popstask, irtvtask, propstask, alltask].filter(Boolean)




    if (debug) console.log("250 focusTasks",  foundRole.tasks, foundtasks);
    if (debug) console.log("251 focusTasks",  foundRole, foundTask, tmptasks, foundtasks,  foundTypes);

    return { // return just id and name and arrays of ids and names
        filterRole: {id: foundRole.id, name: foundRole.name},
        filterTask: {id: foundTask?.id, name: foundTask?.name},
        filterTasks: foundtasks,
        filterTypes: foundTypes
    }
    
}
export default genRoleTasks;