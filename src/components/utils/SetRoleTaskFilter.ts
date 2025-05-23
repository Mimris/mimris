// @ts-nocheck

import { useDispatch } from "react-redux";
import { Dispatch } from "redux";

const debug = false;

const genRoleTasks = (currole, curtask, curtasks, curtypes, mmodel, dispatch: Dispatch<any>) => {
    // const dispatch = dispatch
    // const mmodel = mmodel?.mmodel;
    if (currole !== "Modeller1") { currole = "Modeller1" }
    if (debug) console.log('9 genRoleTasks', curtask)
    if (debug) console.log("10 genRoleTasks", currole, curtask, curtasks, curtypes, mmodel);
    if (debug) console.log("11 genRoleTasks", mmodel.objecttypes0.length, mmodel.objecttypes);
    let datarole, oTypes, oTypes0; 
    if (!mmodel) return 

    if (mmodel?.objecttypes0?.length > 0) {
         oTypes = mmodel?.objecttypes0?.map((ot: { id: any; name: any; description: any; icon: any; color: any; type: any; }) => {
            return {id: ot.id, name: ot.name, description: ot.description, icon: ot.icon, color: ot.color, type: ot.type}
        })
    } else {
        oTypes = mmodel?.objecttypes?.map((ot: { id: any; name: any; description: any; icon: any; color: any; type: any; }) => {
            return {id: ot.id, name: ot.name, description: ot.description, icon: ot.icon, color: ot.color, type: ot.type}
        })
    }

    if (debug) console.log("21 genRoleTasks oTyp", oTypes, oTypes0);
    // console.log('22 ', JSON.stringify(oTypes.map( t => {return t.name})))
    // sort oTypes
    const oTypesSorted = oTypes?.sort((a: { name: string; }, b: { name: string; }) => (a.name > b.name) ? 1 : -1)

    datarole = {
        focusRole: {
            id: "Modeller1",
            name: "Modeller 1",
            tasks: [
                {
                    id: "AKM-IRTV-POPS_META",
                    name: "IRTV-POPS Modelling",
                    description: "Modeling with AKM-IRTV-POPS objects",
                    workOnTypes: [
                    "Container",   
                    "Information",
                    "Role",
                    "Task",
                    "View",
                    "Label",
                    "Product",
                    "Organisation",
                    "Process",
                    "System",   
                    "Actor",
                    ]
                },
                {
                    id: "Process",
                    name: "Process Modelling",
                    description: "Modelling with AKM-IRTV-POPS Process objects",
                    workOnTypes: [  
                    "Process",
                    "Activity",
                    "ParrallelGate",
                    "ExclusiveGate",
                    "InclusiveGate",
                    "Gateway",
                    "Start",
                    "End",
                    "Label",
                    ]
                },
                {
                    id: "IRTV",
                    name: "IRTV Modelling",
                    description: "Model IRTV objects",
                    workOnTypes: [ 
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
                    id: "New-types",
                    name: "New-types",
                    workOnTypes:  [
                        "Container",    
                        ...oTypes?.map((t: { name: any; }) => 
                            (t.name !== "Container") &&
                            // (t.name !=="Information") &&
                            (t.name !=="Role") &&
                            (t.name !=="Task") &&
                            (t.name !=="View") &&
                            (t.name !=="Label") &&
                            (t.name !=="Product") &&
                            (t.name !=="Organisation") &&
                            (t.name !=="Process") &&
                            (t.name !=="System") &&
                            (t.name !=="Activity") &&
                            (t.name !=="ParallelGate") &&
                            (t.name !=="ExclusiveGate") &&
                            (t.name !=="InclusiveGate") &&
                            (t.name !=="Gateway") &&
                            (t.name !=="Start") &&
                            (t.name !=="End") &&
                            (t.name !=="EntityType") &&
                            (t.name !=="Property") &&
                            // (t.name !=="Generic") &&
                            t.name).filter(Boolean),
                            "Role",
                            "Information",
                        "Task",
                        "View",
                        "Label",
                    ]
                },
                {
                    id: "Property",
                    name: "Property Modelling",
                    description: "Create New Entity using objecttype: EntityType and add properties",
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
            ]
        }
    }

    if (debug) console.log("238 genRoleTasks", curtask, mmodel.name);
    // found??? is the task object not only id and name
    const foundRole = datarole?.focusRole // hardcode for now

    const foundMMTask = foundRole?.tasks?.find(t =>  t.id === mmodel.name && t) || null
    const foundPOPSTask = (foundMMTask?.id.includes("POPS")) && foundRole?.tasks?.find(t =>  (t.name === 'AKM-IRTV-POPS_META') && t) || null
    const foundProcessTask = (foundMMTask?.id.includes("POPS")) && foundRole?.tasks?.find(t => (t.id === 'Process') && t) || null
    const foundIRTVTask =  (!foundMMTask?.id.includes("IRTV")) && foundRole?.tasks?.find(t =>  ((mmodel.name.includes("IRTV")) || (mmodel.id.includes("Role"))) && t) || null
    const foundPropertyObj = mmodel.objecttypes.find(ot => ot.name === "Property") || null
    const foundPropertyTask = (foundPropertyObj) && foundRole?.tasks?.find(t =>  t.id === "Property" && t) || null
    if (debug) console.log("247 genRoleTasks", foundPropertyObj, foundPropertyTask )
    const foundAllTask =  datarole.focusRole.tasks.find(t => t.id.includes("All-types") && [{id: t.id, name: t.name}]) || null
    const foundNewTask =  datarole.focusRole.tasks.find(t => t.id.includes("New-types") && [{id: t.id, name: t.name}]) || null

    if (debug) console.log("267 genRoleTasks",  (mmodel.name.includes("POPS")), foundPOPSTask)
    if (debug) console.log("269 genRoleTasks",  foundNewTask?.id, foundMMTask?.id, foundIRTVTask?.id, foundPOPSTask?.id, foundProcessTask?.id, foundPropertyTask?.id, foundAllTask?.id)

    // first check if there is new task, if so, use that first and add others thats not null, else use other tasks with the task with the Metamodel name first
    const foundTasks = (foundNewTask.workOnTypes.length > 1) 
        ? [ foundNewTask, foundMMTask, foundIRTVTask, foundPOPSTask, foundProcessTask, foundPropertyTask, foundAllTask].filter(Boolean) // sf check this 
        : [ foundAllTask, foundMMTask, foundIRTVTask, foundPOPSTask, foundProcessTask, foundPropertyTask].filter(Boolean)
    
        if (debug) console.log("273 genRoleTasks",  foundTasks )
 
    if (debug) console.log("276 genRoleTasks", curtask)
    // curtask = {id: "Property", name: "Property Modelling"}
    if (debug) console.log("279 genRoleTasks", curtask)
    if (debug) console.log("280 genRoleTasks", datarole.focusRole?.tasks.find(t =>  (t.id === curtask?.id) && t))
    if (debug) console.log("281 genRoleTasks", foundRole?.tasks.find(t => t.id ===  mmodel.name && t))
    
    const foundTask = (curtask)
        ? (curtask?.id === 'Metamodelling') 
            ? foundAllTask
            : datarole.focusRole?.tasks.find(t => (t.id === curtask?.id) && t)   
        : (foundNewTask.workOnTypes.length > 1)
                ? foundNewTask 
                : (foundMMTask) 
                    ? foundRole?.tasks.find(t => t.id ===  mmodel.name && t)
                    : foundAllTask
    
    if (debug) console.log("288 genRoleTasks", foundTask, foundTasks)
    if (debug) console.log("289 genRoleTasks",foundTask, foundMMTask, foundIRTVTask, foundPOPSTask, foundPropertyTask, foundAllTask, foundNewTask);
    
    if (oTypes.length > 0) dispatch({ type: 'SET_FOCUS_ROLE', data: foundRole })
    if (foundTask) dispatch({ type: 'SET_FOCUS_TASK', data: {id: foundTask.id, name: foundTask.name} })

    const foundTypes = (foundTask) ? foundTask?.workOnTypes : curtask?.workOnTypes 
    
    if (debug) console.log("295 foundTypes", foundTypes)

    if (debug) console.log("297 focusTasks",  foundTask, foundMMTask,  foundNewTask, foundIRTVTask, foundPOPSTask, foundPropertyTask, foundAllTask);
    if (debug) console.log("298 focusTasks",  foundTasks,  foundTypes);
    
    const filterRole = {id: foundRole.id, name: foundRole.name}
    const filterTask = {id: foundTask?.id, name: foundTask?.name}
    const filterTasks = foundTasks.map(ft => ({id: ft.id, name: ft.name}))
    const filterTypes = foundTypes
    if (debug) {
        console.log("298 genRoleTasks filterRole", filterRole)
        console.log("299 genRoleTasks filterTask", filterTask)
        console.log("300 genRoleTasks filterTasks", filterTasks)
        console.log("301 genRoleTasks filterTypes", filterTypes)
    }

    return { // return just id and name
        currole: filterRole,
        curtask: filterTask,
        curtasks: filterTasks,
        curtypes: filterTypes
    } 
}
export default genRoleTasks;