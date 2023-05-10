// @ts-nocheck

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
        const importedfile = JSON.parse(text)
        const filename = reader.fileName 
        console.log('18 ReadModelFromFile', filename, importedfile)

        let data =  importedfile

        function dispatchLocalFile(type, data) {
            if (debug) console.log('24 ReadModelFromFile', data)
            dispatch({ type: type, data: data })
        }

        // ---------------------  load Project model files ---------------------
        if (!debug) console.log('29 ReadModelFromFile',filename, props, )

        if (importedfile.phData) { // if modelff has phData, then it is a project file 

            dispatchLocalFile('LOAD_TOSTORE_PHDATA', data.phData)
            dispatchLocalFile('SET_FOCUS_PHFOCUS', data.phFocus)
            dispatchLocalFile('LOAD_TOSTORE_PHSOURCE', data.phSource)
            dispatchLocalFile('LOAD_TOSTORE_PHUSER', data.phUser)

        } else if (filename.includes('_MV')) { // if modelff is a modelview, then it is a modelview file with objects and metamodel
            if (!debug) console.log('56 ReadModelFromFile _MV found',  importedfile, data)
            const impModels = data.models || null
            const impModelviews = data.modelviews || null
            const impMetamodels = data.metamodels || null
            const impObjects= data.objects || null
            const impObjecttypes = data.objecttypes || null
            const impRelships = data.relships || null

            const impModel = (impModels) && impModels[0]  // max one model in modelview file for now
            const impModelview = (impModelviews) && impModelviews[0] // max one modelview in modelview file for now
            const impMetamodel = (impMetamodels) && impMetamodels[0] // max one model in modelview file for now

            // ---------------------  Set up current model for merging of imported data ---------------------
            const metis = props.phData.metis
            const focus = props.phFocus
            const curmod = metis.models.find(m => m.id === focus.focusModel?.id)
            const curmmod = metis.metamodels.find(m => m.id === curmod.metamodelRef)
            const modelviews = curmod.modelviews
            const curmodview = modelviews.find(mv => mv.id === focus.focusModelview?.id)

            // first we check the imported modelview against the current metamodel
            impObjects?.forEach(o => { // add standard necessary attributes to object
                if (!o.id) { o.id = uuidv4(); }
                if (!o.category) { o.category = 'Object'; }
                if (!o.typeName) { o.typeName = 'Generic'; }
                if (!o.nameId) { o.nameId = '' }
                if (!o.viewkind) { o.viewkind = '' }
                if (!o.markedAsDeleted) { o.markedAsDeleted = false; }
                if (!o.modified) { o.modified = false; }
            });
            console.log('77 ReadModelFromFile', impObjects)
            // objettypes
            let otindex, otlength

            // map over objecttypes in modelff and add typeName from objecttypes
            function addTypenameFromObjectTypes(objecttypes, objects) { // obecttypes and objects is imported from file
                if (debug) console.log('67 ReadModelFromFile',  objecttypes, objects)
                objects?.forEach(o => {
                    const otindex = objecttypes.findIndex(ot => ot.id === o.typeRef)
                    if (otindex >= 0) {
                        o.typeName = objecttypes[otindex].name
                    }          
                })
                return objects
            }
            const editedmodelffobjects = addTypenameFromObjectTypes(impObjecttypes, impObjects)

            
            // chande the typeRef in objects to point to types with the same typeName in currentMetamodel.objecttypes
            // map over mmodelffobjecttypes and find the type in currentMetamodel.objecttypes with the same typeName and replace the typeRef in mmodelffobjects
            function replaceTypeRefFromObjectTypes(objecttypes, objects) {
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
                           
            const editedmodelffobjects2 = replaceTypeRefFromObjectTypes(curmmod.objecttypes, editedmodelffobjects)

            if (debug)  console.log('75 ReadModelFromFile',   editedmodelffobjects, editedmodelffobjects2)

            // models
            if (debug) console.log('87 ReadModelFromFile',   modelff)
            let mindex = props.phData?.metis?.models?.findIndex(m => m.id === props.phFocus.focusModel?.id) // current focusmodel index
            let mlength = props.phData?.metis?.models.length

            // modelviews
            let mvindex, mvlength
            mvindex = (impModelview?.id) && props.phData?.metis?.models[mindex]?.modelviews.findIndex(mv => mv.id === impModelview?.id) // current modelview index
            mvlength = props.phData?.metis?.models[mindex]?.modelviews?.length;
            if (!mvindex || mvindex < 0) { mvindex = mvlength } // mvindex = -1, i.e.  not fond, which means adding a new modelview
            const tmpmv = props.phData.metis.models[mindex].modelviews
            console.log('112 ReadModelFromFile', tmpmv, mvindex, mvlength, impModelview)
            if (mvindex >= 0) { // if modelview exist, then add additional objectviews to the existing modelview
                // curmodview?.objectviews.forEach(ov => {
                //     const ovindex = tmpmv[mvindex].objectviews.findIndex(ovv => ovv.id === ov.id)
                //     if (ovindex < 0) { tmpmv[mvindex].objectviews.push(ov) } // if objectview does not exist, then add it to the existing modelview
                // })
            } else { // if modelview does not exist, then add it to props.phData.metis.models[mindex].modelviews
                // tmpmv.push(modelff.modelview)
            }

            // objects
            
            const tmpo = props.phData.metis.models[mindex].objects; // remove all objects from tmpo that are in modelff.objects
            console.log('124 ReadModelFromFile', tmpo);


            // merge objects from modelff.objects into tmpo
            function mergeObjectsFromModelffObjects(objects, tmpo) {
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

            // Remove duplicates based on the 'id' property
            const uniqueTmpo = tmpo.filter((obj, index, self) => {
                return index === self.findIndex((t) => t.id === obj.id);
            });

            return uniqueTmpo;git 
            }
            const editedmodelffobjects3 = mergeObjectsFromModelffObjects(impObjects, tmpo);

            console.log('144 ReadModelFromFile',   editedmodelffobjects3)
            let oindex = tmpo.findIndex(o => o.id === impObjects[0]?.id)
            const olength = tmpo.length
            if (oindex && (oindex < 0)) { oindex = olength } // oindex = -1, i.e.  not fond, which means adding a new object

            // relships
            let rindex = props.phData.metis.models[mindex].relships.findIndex(r => (r) && r.id === impRelships[0]?.id)
            const rlength = props.phData.metis.models[mindex].relships.length
            if (rindex && (rindex < 0)) { rindex = rlength } // rindex = -1, i.e.  not fond, which means adding a new relationship
            //  if relationship already exist in props.phData.metis.models[mindex].relships, then remove it from props.phData.metis.models[mindex].relships 
            // const tmprels = props.phData.metis.models[mindex].relships
            // if (rindex >= 0) { tmprels.splice(rindex, 1) } // if relationship exist, then remove it from props.phData.metis.models[mindex].relships, i.e. the relationship will be replaced by the new relationship
            //  if metamodel already exist in props.phData.metis.metamodels, then replace it with the new metamodel
            let mmindex = (impMetamodel?.id) && props.phData.metis.metamodels.findIndex(m => m.id === impMetamodel?.id)
            const mmlength = props.phData.metis.metamodels.length;
            if (!mmindex || mmindex < 0) mmindex = mmlength// if metamodel exist, then replace it with the new metamodel
            console.log('160 ReadModelFromFile', mindex, mvindex, mmindex)
            
            if (debug) console.log('148 ReadModelFromFile', tmpobj,  props.phData.metis.models[mindex].objects);  
            if (debug) console.log('149 ReadModelFromFile',  props.phData.metis.models[mindex].objects);
            if (!impObjects || !impRelships) {
                const r = window.confirm("This Modelview import has no Objects and/or Relships. Click OK to cancel?")
                if (r === false) { return null } // if user clicks cancel, then do nothing
            }
            data = {
                phData: {
                    ...props.phData,
                    metis: {
                        ...props.phData.metis,
                        metamodels: (impMetamodels) ? [
                            ...props.phData.metis.metamodels?.slice(0, mmindex),
                            {
                                ...props.phData.metis.metamodels[mmindex],
                                objecttypes: (modelffobjecttypes?.objecttypes) ? [
                                    ...props.phData.metis.metamodels[mmindex].objecttypes?.slice(0, otindex),
                                    ...impObjecttypes,
                                    ...props.phData.metis.metamodels[mmindex].objecttypes?.slice(otindex + 1, otlength),
                                ] : props.phData.metis.metamodels[mmindex].objecttypes,
                                reltypes: (modelffreltypes?.reltypes) ? [
                                    ...props.phData.metis.metamodels[mmindex].reltypes?.slice(0, rtindex),
                                    ...impReltypes,
                                    ...props.phData.metis.metamodels[mmindex].reltypes?.slice(rtindex + 1, rtlength),
                                ] : props.phData.metis.metamodels[mmindex].reltypes,
                            },
                            ...props.phData.metis.metamodels?.slice(mmindex + 1, mmlength),
                        ] : props.phData.metis.metamodels,
                        models: [
                            ...props.phData.metis.models?.slice(0, mindex),
                            {
                                ...props.phData.metis.models[mindex],
                                modelviews: (impModelviews) ? [
                                    ...props.phData.metis.models[mindex].modelviews?.slice(0, mvindex),
                                    impModelview,
                                    ...props.phData.metis.models[mindex].modelviews?.slice(mvindex + 1, mvlength),
                                ] : props.phData.metis.models[mindex].modelviews,
                                objects: (editedmodelffobjects3) ? [
                                    ...props.phData.metis.models[mindex].objects?.slice(0, oindex),
                                    ...editedmodelffobjects3,
                                    ...props.phData.metis.models[mindex].objects?.slice(oindex + 1, olength),
                                ] : props.phData.metis.models[mindex].objects,
                                relships: (impRelships) ? [
                                    ...props.phData.metis.models[mindex].relships?.slice(0, rindex),
                                    ...impRelships,
                                    ...props.phData.metis.models[mindex].relships?.slice(rindex + 1, rlength),
                                ] : props.phData.metis.models[mindex].relships,
                            },
                            ...props.phData.metis.models?.slice(mindex + 1, mlength),
                        ],
                    },
                },
            }
            if (debug) console.log('222 ReadModelFromFile', modelffobjecttypes, editedmodelffobjects3, modelffrelships);
            if (!debug) console.log('223 ReadModelFromFile', data);
  
        } else if (filename.includes('_MO')) { // then it is a model file           
            if (debug) console.log('226 ReadModelFromFile _MO found', filename, modelff);
            // if model already exist in props.phData.metis.models, then remove it from props.phData.metis.models
            const mmindex = props.phData.metis.models.findIndex(m => m.id === modelff.id)
            const tmpmodel = props.phData.metis.models
            if (mmindex >= 0) {   // if model exist, then remove it from props.phData.metis.models, i.e. the model will be replaced by the new model
                alert("Model already exists! Delete current model and try again!")
                return null
            } else { // mmindex = -1, i.e.  not fond, which means adding a new model
                const r = window.confirm("This model import will also add corresponding Metamodel!  Click OK to continue?")
                if (r === false) { 
                    return null // if user clicks cancel, then do nothing
                } 
            } 
                
            data = {
                phData: {
                    ...props.phData,
                    metis: {
                        ...props.phData.metis,
                        metamodels: [
                            ...props.phData.metis.metamodels,   
                            modelffmetamodels
                        ],
                        models: [
                            ...props.phData.metis.models,     
                            modelffmodels,
                        ],
                    },
                }, 
            };
              
        } else if (filename.includes('_MM')) { // if filename contains _MM, then it is a metamodel file
            let  mmmindex = props.phData?.metis?.metamodels?.findIndex(m => m.id === modelff?.id) // current model index
            const mmlength = props.phData?.metis?.metamodels.length
            if ( mmmindex < 0) { mmmindex = mmlength } // ovindex = -1, i.e.  not fond, which means adding a new model
            if (debug) console.log('108 ReadModelFromFile', metamodelff, mmmindex, mmlength);
            data = {
                phData: {
                    ...props.phData,
                    metis: {
                        ...props.phData.metis,
                        metamodels: [ 
                            ...props.phData.metis.metamodels?.slice(0, mmindex),  
                            {  
                                ...props.phData.metis.metamodels[mmindex],  
                                modelff
                            },
                            ...props.phData.metis.metamodels?.slice(mmindex + 1, mlength),
                        ],
                    },
                }, 
            };  
        } else {
        }

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


