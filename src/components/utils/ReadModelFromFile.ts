// @ts-nocheck

import { setFocusModel } from "../../actions/actions";
import { i } from "./SvgLetters";

const debug = false

export const ReadModelFromFile = async (props, dispatch, e) => { // Read Project from file
    
    e.preventDefault();
    const reader = new FileReader();
    reader.fileName = '' // reset fileName
    reader.fileName = (e.target.files[0]?.name)
    if (debug) console.log('13 ReadModelFromFile', props, reader.fileName)
    if (!reader.fileName) return null
    reader.onload = async (e) => { 
        const text = (e.target.result)
        let importedfile = JSON.parse(text)
        const filename = reader.fileName 
        console.log('18 ReadModelFromFile', filename, importedfile)

        const impObjecttypes = importedfile.objecttypes || null
        const impRelshiptypes = importedfile.relshiptypes || null
        const impModelviews = importedfile.modelviews || null
        const impMetamodels = importedfile.metamodels || null
        const impObjects= importedfile.objects || null
        const impRelships = importedfile.relships || null
        const impModels = importedfile.models || null
        // const impModel = (impModels) && impModels[0]  // max one model in modelview file for now
        const impModelview = (impModelviews) && impModelviews[0] // max one modelview in modelview file for now
        const impMetamodel = (impMetamodels) && impMetamodels[0] // max one model in modelview file for now
        // ---------------------  Set up current model for merging of imported data ---------------------
        const metis = props.phData.metis
        const focus = props.phFocus
        const curmod = metis.models.find(m => m.id === focus.focusModel?.id)
        if (!curmod) return null
        const curmmod = metis.metamodels.find(m => m.id === curmod.metamodelRef)
        const modelviews = curmod.modelviews
        const curmodview = modelviews.find(mv => mv.id === focus.focusModelview?.id)
        
        let mmindex = (impMetamodel?.id) && props.phData.metis.metamodels.findIndex(m => m.id === impMetamodel?.id)

        // ---------------------  Set up imported model for merging of imported data ---------------------
        let data = importedfile
        // let data = (importedfile.models)
        //         ?   { // if no phData, then create phData.metis
        //                 phData: {
        //                     metis: {
        //                         ...importedfile
        //                     }
        //                 }
        //             }
        //         : importedfile

        // ---------------------  add mv if missing in import ---------------------
        // if (!data.phData?.metis.models[0].modelviews) { // if modelview does not exist, then add it to   data.phData.metis.models
        //     data.phData.metis.models[0].modelviews = [
        //         {
        //             id: 'mv1',
        //             name: 'mv1',
        //             // markedAsDeleted: false,
        //             modified: false,
        //             modelRef: curmod.id,
        //             objectviews: [],
        //             relshipviews: [],
        //             objecttypeviews: [],
        //             relshiptypeviews: []
        //         }
        //     ]    
        // }

        console.log('29 ReadModelFromFile', data)
  
  
        // check if imported objtype is compatible with current metamodel
        if (impMetamodels) {
            data.phData?.metis?.metamodels[0]?.objecttypes?.forEach(ot => { // add standard necessary attributes to relship
                if (!ot.abstract) { ot.abstract = false }
                if (!ot.viewkind) { ot.viewkind = 'Object' }
                if (!ot.typeName) { ot.typeName = 'Object type'; }
                if (!ot.markedAsDeleted) { ot.markedAsDeleted = false; }
                if (!ot.modified) { ot.modified = false; }
            });
            // check if imported objtype is compatible with current metamodel
            data.phData?.metis?.metamodels[0]?.objecttypeviews?.forEach(otv => { // add standard necessary attributes to relship
                if (!otv.viewkind) { otv.viewkind = 'Object' }
                if (!otv.template) { otv.template = 'textAndIcon' }
                if (!otv.markedAsDeleted) { otv.markedAsDeleted = false; }
                if (!otv.modified) { otv.modified = false; }
            });
            // check if imported reltype is compatible with current metamodel
            data.phData?.metis?.metamodels[0]?.relshiptypes?.forEach(r => { // add standard necessary attributes to relship
                if (!r.relshipkind) { r.relshipkind = 'Association'; }
                if (!r.cardinality) { r.cardinality = ''; }
                if (!r.cardinalityFrom) { r.cardinalityFrom = ''; }
                if (!r.cardinalityTo) { r.cardinalityTo = ''; }
            });
        }
        // -------------- check if imported relship is compatible with current metamodel ---------------------
        if (impModels) {
            // -------------- check if imported objects is compatible with current metamodel ---------------------
            // first we check the imported modelview against the current metamodel
            data.phData?.metis?.models[0]?.objects?.forEach(o => { // add standard necessary attributes to object
                if (!o.category) { o.category = 'Object'; }
                if (!o.typeName) { o.typeName = 'Generic'; }
                if (!o.description) { o.description = ''; }
                if (!o.nameId) { o.nameId = '' }
                if (!o.viewkind) { o.viewkind = '' }
                if (!o.markedAsDeleted) { o.markedAsDeleted = false; }
                if (!o.modified) { o.modified = false; }
                if (!o.generatedTypeId) { o.generatedTypeId = '' }
                if (!o.abstract) { o.abstract = false }
                if (!o.valueset) { o.valueset = null }
                if (!o.relshipkind) { o.relshipkind = 'Association' }
            });       
            data.phData?.metis?.models[0]?.relship?.forEach(r => { // add standard necessary attributes to relship 
                if (!r.viewkind) { r.viewkind = '' }
                if (!r.markedAsDeleted) { r.markedAsDeleted = false; }
                if (!r.modified) { r.modified = false; }
                if (!r.relshipkind) { r.description = 'Association'; }
                if (!r.cardinality) { r.cardinality = '0-n'; }
                if (!r.cardinalityFrom) { r.cardinalityFrom = '0'; }
                if (!r.cardinalityTo) { r.cardinalityTo = 'n'; }
            });
        } else {
            // -------------- check if imported objects is compatible with current metamodel ---------------------
            impObjects?.forEach(o => { // add standard necessary attributes to object
                if (!o.category) { o.category = 'Object'; }
                if (!o.typeName) { o.typeName = 'Generic'; }
                if (!o.description) { o.description = ''; }
                if (!o.viewkind) { o.viewkind = '' }
                if (!o.markedAsDeleted) { o.markedAsDeleted = false; }
                if (!o.modified) { o.modified = false; }
                if (!o.generatedTypeId) { o.generatedTypeId = '' }
                if (!o.abstract) { o.abstract = false }
                if (!o.valueset) { o.valueset = null }
                if (!o.relshipkind) { o.relshipkind = 'Association' }
            });
            impRelships?.forEach(r => { // add standard necessary attributes to relship
                if (!r.viewkind) { r.viewkind = '' }
                if (!r.markedAsDeleted) { r.markedAsDeleted = false; }
                if (!r.modified) { r.modified = false; }
                if (!r.relshipkind) { r.description = 'Association'; }
                if (!r.cardinality) { r.cardinality = '0-n'; }
                if (!r.cardinalityFrom) { r.cardinalityFrom = '0'; }
                if (!r.cardinalityTo) { r.cardinalityTo = 'n'; }
            });
        }




        console.log('100 ReadModelFromFile', data)

        if (debug) console.log('187 ReadModelFromFile 1', data.phData?.metis)

        // -------------map over objecttypes in modelff and add typeName from objecttypes
        function addTypenameFromObjectTypes(objecttypes, objects) { // obecttypes and objects is imported from file
            if (debug) console.log('67 ReadModelFromFile',  objecttypes, objects)
            objects?.forEach(o => {
                const otindex = objecttypes?.findIndex(ot => (ot) && ot.id === o.typeRef)
                if (otindex >= 0) {
                    o.typeName = objecttypes[otindex].name
                }          
                o.nameId = o.name
                o.description = o.description
            })
            return objects
        }
        const editedmodelffobjects = addTypenameFromObjectTypes(impObjecttypes, impObjects)

        // chande the typeRef in objects to point to types with the same typeName in currentMetamodel.objecttypes
        // map over mmodelffobjecttypes and find the type in currentMetamodel.objecttypes with the same typeName and replace the typeRef in mmodelffobjects
        function replaceTypeRefFromObjectTypesWhithSameTypename(objecttypes, objects) {
            if (debug) console.log('67 ReadModelFromFile',  objecttypes, objects)
            objects?.forEach(o => {               
                // check if objecttype exists in currentMetamodel.objecttypes
                const otindex = objecttypes.findIndex(ot => ot.name === o.typeName)
                console.log('90 otindex', otindex, o.typeName)
                if (otindex >= 0) {
                    o.typeRef = objecttypes[otindex].id
                    o.typeName = objecttypes[otindex].name
                }
            })
            return objects
        }
        const editedmodelffobjects2 = (curmod.objecttypes) && replaceTypeRefFromObjectTypesWhithSameTypename(curmmod?.objecttypes, editedmodelffobjects)
        // models
        let mindex = props.phData?.metis?.models?.findIndex(m => m.id === props.phFocus.focusModel?.id) // current focusmodel index
        let mlength = props.phData?.metis?.models.length
        // ---------------------  replace existing with the imported (overwrite) ---------------------          
        const tmpo = props.phData.metis.models[mindex].objects; // remove all objects from tmpo that are in modelff.objects
        console.log('124 ReadModelFromFile', tmpo);

        // merge objects from modelff.objects into tmpo
        function mergeObjectsFromModelffObjects(objects, tmpo) {
            if (!tmpo) return;
            if (debug) console.log("120 ReadModelFromFile", objects, tmpo);
            objects?.forEach((o) => {
                const oindex = tmpo.findIndex((ot) => ot.id === o.id);
                if (debug) console.log("133 ReadModelFromFile", oindex, o, tmpo);
                if (oindex < 0) {
                tmpo.push(o); // if object does not exist, then add it to props.phData.metis.models[mindex].objects
                } else {
                tmpo[oindex] = o; // if object exists, then replace it in props.phData.metis.models[mindex].objects
                }
            });
            // Remove duplicates based on the 'id' property¯
            const uniqueTmpo = tmpo?.filter((obj, index, self) => {
                return index === self.findIndex((t) => t.id === obj.id);
            });
            return uniqueTmpo;
        }
        
        const editedmodelffobjects3 = mergeObjectsFromModelffObjects(impObjects, tmpo);

        console.log('144 ReadModelFromFile',   editedmodelffobjects3)

        // ---------------------  add metamodel if imported  --------------------
        if (debug) console.log('237 ReadModelFromFile',filename, props, )

        function dispatchLocalFile(type, data) {
            if (debug) console.log('240 ReadModelFromFile', data)
            dispatch({ type: type, data: data })
        }

        // ---------------------  check type of import --------------------- Todo: this can be removed

        if (filename.includes('_MV')) { // if modelff is a modelview, then it is a modelview file with objects and metamodel
            if (debug) console.log('248 ReadModelFromFile _MV found', data)

            if (!impObjects) { //|| !impRelships) {
                const r = window.confirm("This Modelview import has no Objects and/or Relships. Click OK to cancel?")
                if (r === false) { return null } // if user clicks cancel, then do nothing
            }

            const mmod = data.metamodels
            const modview = data.modelviews
            const mobjects = data.objects
            const mrelships = data.relships

            // dispatch mmod, modview, mobjects, mrelships to store
            const r = window.confirm(`This import includes metamodel: ${mmod.name}. If you want to import this metamodel, Click OK`)
            if (r === true) { 
                dispatchLocalFile('UPDATE_METAMODEL_PROPERTIES', mmod)
            }
            dispatchLocalFile('UPDATE_MODELVIEW_PROPERTIES', modview)
            const objects = mobjects.map(o => {
                dispatchLocalFile('UPDATE_OBJECT_PROPERTIES', o)
            })
            const relships = mrelships.map(r => {
                dispatchLocalFile('UPDATE_RELSHIP_PROPERTIES', r)
            })
            return ; // skip the rest of this function
        }


        // if (filename.includes('_MO')) { // if modelff is a model, then it is a model file with model
        //     if (debug) console.log('248 ReadModelFromFile _MV found', data)
        //     if (!impModels) { //|| !impRelships) {
        //         const r = window.confirm("This Model import has no model object. Click OK to cancel?")
        //         if (r === false) { return null } // if user clicks cancel, then do nothing
        //     }
        //     const mod = data.models
        //     // dispatch mod, to store
        //     dispatchLocalFile('UPDATE_MODEL_PROPERTIES', mod)
        //     return ; // skip the rest of this function
        // }
        // merge imported with existing project
        if (data.phData || filename.includes('_PR' || '.Project')) { // its a project file, just import as is
            data = importedfile
        } else if (importedfile.phData) { // its a model, modelview or metamodel file, merge with existing project
            data = {
                phData: {
                    ...props.phData,
                    metis: {
                        ...props.phData.metis,
                        metamodels: [
                            ...props.phData.metis.metamodels,
                            (impMetamodels) && data.phData.metis.metamodels,             
                        ] ,
                        models: [
                            ...props.phData.metis.models,
                            ...data.phData.metis.models,
                        ],
                    },
                },
            }
        } else if (filename.includes('_MO')) { // its a model, modelview or metamodel file, merge with existing project
            console.log('290 ReadModelFromFile', data, data.models[0].modelviews.length)
            if (data.models[0].modelviews.length === 0) { // if modelview exists, then add it to   data.phData.metis.models
                console.log('292 ReadModelFromFile', data.models[0].modelviews.length)
                data.models[0].modelviews[0] = 
                {
                    id: 'mv1',
                    name: 'mv1',
                    markedAsDeleted: false,
                    modified: false,
                    modelRef: data.models[0].id,
                    UseUMLrelshipkinds: false,
                    includeInheritedReltypes: false,
                    objectviews: [],
                    relshipviews: [],
                    objecttypeviews: [],
                    relshiptypeviews: []
                }              
            }
   
            console.log('304 ReadModelFromFile', data, props.phData.metis.metamodels)
            data = {
                phData: {
                    ...props.phData,
                    metis: {
                        ...props.phData.metis,
                        metamodels: [
                            ...props.phData.metis.metamodels,
                            // (impMetamodels) && data.phData.metis.metamodels,             
                        ] ,
                        models: [
                            ...props.phData.metis.models,
                            ...data.models,
                        ],
                    },
                },
            }
            console.log('307 ReadModelFromFile', data)
        } else if (filename.includes('_OR')) { // its a Object relationship file, merge with existing project'
            console.log('339 ReadModelFromFile', data)
            let mindex = props.phData?.metis?.models?.findIndex(m => m.id === curmod.id) // current model index
            let mlength = props.phData?.metis?.models.length
            // check if imported file has objects and relships
            if (data.objects && data.relships) {
                data = {
                    phData: {
                        ...props.phData,
                        metis: {
                            ...props.phData.metis,
                            models: [
                                ...props.phData.metis.models?.slice(0, mindex),
                                {
                                    ...props.phData.metis.models[mindex],
                                    objects: [
                                        ...props.phData.metis.models[mindex].objects,
                                        ...data.objects,
                                    ],
                                    relships: [
                                        ...props.phData.metis.models[mindex].relships,
                                        ...data.relships,
                                    ],
                                },
                                ...props.phData.metis.models?.slice(mindex + 1, mlength),
                            ],
                        },
                    },
                }
            }
        } else if (filename.includes('_MM')) { // its a metamodel file, merge with existing project'
            data = {
                phData: {
                    ...props.phData,
                    metis: {
                        ...props.phData.metis,
                        metamodels: [
                            ...props.phData.metis.models,
                            data,
                        ],
                    },
                },
            }
        } else { // its a model file, merge with existing project'
            console.log('335 ReadModelFromFile: ', data )
            // find current model index
            let mindex = props.phData?.metis?.models?.findIndex(m => m.id === curmod.id) // current model index
            // check if imported file has objects and relships
            if (data.phData?.metis?.models[0]?.objects && data.phData.metis.models[0]?.relships)  {
                data = {
                    phData: {
                        ...props.phData,
                        metis: {
                            ...props.phData.metis,
                            models: [
                                ...props.phData.metis.models?.slice(0, mindex),
                                {
                                    ...props.phData.metis.models[mindex],
                                    objects: [
                                        ...props.phData.metis.models[mindex].objects,
                                        ...data.phData.metis.models[0].objects,
                                    ],
                                    relships: [
                                        ...props.phData.metis.models[mindex].relships,
                                        ...data.phData.metis.models[0].relships,
                                    ],
                                },
                                ...props.phData.metis.models?.slice(mindex + 1, mlength),
                            ],
                        },
                    },
                }
            }
        }

        if (debug) console.log('356 ReadModelFromFile', data, importedfile?.phData?.metis.models, importedfile?.phData?.metis.metamodels)
        dispatchLocalFile('LOAD_TOSTORE_PHDATA', data.phData)
        if (data.phFocus) dispatchLocalFile('SET_FOCUS_PHFOCUS', data.phFocus)
        if (data.phSource) dispatchLocalFile('LOAD_TOSTORE_PHSOURCE', data.phSource) 
        if (data.phUser) dispatchLocalFile('LOAD_TOSTORE_PHUSER', data.phUser)
        // dispatch({type: 'SET_FOCUS_REFRESH', data:  {id: Math.random().toString(36).substring(7), name: 'refresh'}})
    };
    reader.readAsText(e.target.files[0])
  }

export const ReadMetamodelFromFile = async (props, dispatch, e) => {
    e.preventDefault()
    const reader = new FileReader()
    reader.onload = async (e) => { 
        const text = (e.target.result)
        const metamodelff = JSON.parse(text)
        //   alert(text)
        if (debug) console.log('170 ReadModelFromFile', props);
        let  mmmindex = props.phData?.metis?.metamodels?.findIndex(m => m.id === metamodelff?.id) // current model index
        const mmlength = props.phData?.metis?.metamodels.length
        if ( mmmindex < 0) { mmmindex = mmlength } // ovindex = -1, i.e.  not fond, which means adding a new model
        if (debug) console.log('174 ReadModelFromFile', metamodelff, mmmindex, mmlength);
        
        const data = {
            phData: {
                ...props.phData,
                metis: {
                    ...props.phData.metis,
                    metamodels: [
                        ...props.phData.metis.metamodels.slice(0, mmmindex),     
                        metamodelff,
                        ...props.phData.metis.metamodels.slice(mmmindex + 1, props.phData.metis.metamodels.length),
                    ],
                    models: props.phData.metis.models,   
                },
            }, 
        };
        if (debug) console.log('190 ReadModelFromFile', data);
        
        props.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
    };
    reader.readAsText(e.target.files[0])
  }


