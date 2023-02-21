
// @ts-nocheck

import { loadToStorePhdata } from "../../actions/actions"

const debug = false

export const ReadModelFromFile = async (props, dispatch, e) => { // Read Project from file
    e.preventDefault()
    const reader = new FileReader()
    reader.fileName = '' // reset fileName
    reader.fileName = (e.target.files[0]?.name)
    console.log('92 ReadModelFromFile', reader.fileName)
    if (!reader.fileName) return null
    reader.onload = async (e) => { 
        const text = (e.target.result)
        const modelff = JSON.parse(text)
        const filename = e.target.fileName 

        //   alert(text)
        if (debug) console.log('46 ReadModelFromFile', props.phFocus.focusModel.id);
        if (debug) console.log('44 ReadModelFromFile', props, modelff);
    
        let mindex = props.phData?.metis?.models?.findIndex(m => m.id === modelff?.id) // current model index
        let mlength = props.phData?.metis?.models.length
        console.log('104 ReadModelFromFile', mindex, mlength, modelff?.id, props.phData?.metis?.models[mindex]?.id)

        // ---------------------  load Project ---------------------
        console.log('142 ReadModelFromFile',  props, modelff)
        let data
        if (modelff.phData) { // if modelff has phData, then it is a project file
            console.log('145 ReadModelFromFile',  props.phData?.metis, modelff.phData?.metis)
            
            if (!modelff.phFocus.focusModel) { // if modelff has no focusModel, then set it to the first model
                modelff.phFocus.focusModel= {id: modelff.phData.metis.models[0].id, name: modelff.phData.metis.models[0].name}
            }
            if (modelff.phFocus.focusModelView) { // if modelff has no focusModelView, then set it to the first modelview
                modelff.phFocus.focusModelView= {id: modelff.phData.metis.models[0].modelviews[0].id, name: modelff.phData.metis.models[0].modelviews[0].name}
            }

            data = {
                phData:   modelff.phData,
                phFocus:  modelff.phFocus,
                phUser:   modelff.phUser,
                phSource: filename,
              }
        } else if (modelff.modelview) { // if modelff has modelview, then it is a modelview file

            let fmindex = props.phData?.metis?.models?.findIndex(m => m.id === props.phFocus.focusModel?.id) // current focusmodel index
            let mvindex, mvlength
            mvindex = props.phData?.metis?.models[fmindex]?.modelviews.findIndex(mv => mv.id === modelff.modelview?.id) // current modelview index
            mvlength = props.phData?.metis?.models[fmindex]?.modelviews?.length;
            if (mvindex < 0) { mvindex = mvlength } // mvindex = -1, i.e.  not fond, which means adding a new modelview

            // find objects in model with objectRefs
            const mvobjects = modelff.objects || []
            if (debug) console.log('55 ReadModelFromFile', modelff, mvobjects);

            data = {
                phData: {
                    ...props.phData,
                    metis: {
                        ...props.phData.metis,
                        metamodels: props.phData.metis.metamodels,   
                        models: [
                            ...props.phData.metis.models?.slice(0, fmindex),  
                            {  
                                ...props.phData.metis.models[fmindex],
                                // add objects wich exist in modelview
                                objects: [
                                    ...props.phData.metis.models.objects,
                                    ...mvobjects
                                ],
                                modelviews: [ 
                                    ...props.phData.metis.models[fmindex]?.modelviews?.slice(0, mvindex),  
                                    {  
                                        ...props.phData.metis.models[fmindex]?.modelviews[mvindex],  
                                        ...modelff.modelview,
                                    },
                                    ...props.phData.metis.models[fmindex]?.modelviews?.slice(mvindex+1, mvlength),  
                                ],
                            },
                            ...props.phData.metis.models?.slice(fmindex + 1, mlength),
                        ],
                    },
                }, 
            };

        } else if (filename.includes('_MM')) { // if filename contains _MM, then it is a metamodel file
            let  mmindex = props.phData?.metis?.metamodels?.findIndex(m => m.id === modelff?.id) // current model index
            const mmlength = props.phData?.metis?.metamodels.length
            if ( mmindex < 0) { mmindex = mmlength } // ovindex = -1, i.e.  not fond, which means adding a new model
            if (debug) console.log('189 ReadModelFromFile', metamodelff, mmindex, mmlength);
            data = {
                phData: {
                    ...props.phData,
                    metis: {
                        ...props.phData.metis,
                        metamodels: [ 
                            ...props.phData.metis.metamodels?.slice(0, mindex),  
                            {  
                                ...props.phData.metis.metamodels[mindex],  
                                ...modelff,
                            },
                            ...props.phData.metis.metamodels?.slice(mindex + 1, mlength),
                        ],
                    },
                }, 
            };    
        } else { // then it is a model file            console.log('116 SaveModelToFile', mindex, mlength, modelff?.id, props.phData?.metis?.models[mindex]?.id)

            const r = window.confirm("Model already exists! Existing: "+props.phData?.metis?.models[mindex]?.name+" New: "+modelff?.name+" Do you want to replace (overwrite it)?")
            // const r = window.confirm("Model already exists, do you want to replace it?")
            if (r === false) { //  add model but change model id
                modelff.id = modelff.id + mlength
                mindex = mlength
                console.log('124 ReadModelFromFile', mindex, mlength, modelff?.id, props.phData?.metis?.models[mindex]?.id)
            }


            data = {
                phData: {
                    ...props.phData,
                    metis: {
                        ...props.phData.metis,
                        metamodels: props.phData.metis.metamodels,   
                        models: [
                            ...props.phData.metis.models.slice(0, mindex),     
                            modelff,
                            ...props.phData.metis.models.slice(mindex + 1, mlength),
                        ],
                    },
                }, 
            };
        }
        if (debug) console.log('193 ReadModelFromFile', data);      
        if (data.phData)    props.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
        if (data.phFocus)   props.dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: data.phFocus })
        if (data.phUser)    props.dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: data.phUser })
        if (data.phSource)  props.dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data.phSource })
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
        if (debug) console.log('155 ReadModelFromFile', props);
        let  mmindex = props.phData?.metis?.metamodels?.findIndex(m => m.id === metamodelff?.id) // current model index
        const mmlength = props.phData?.metis?.metamodels.length
        if ( mmindex < 0) { mmindex = mmlength } // ovindex = -1, i.e.  not fond, which means adding a new model
        if (debug) console.log('189 ReadModelFromFile', metamodelff, mmindex, mmlength);
        
        const data = {
            phData: {
                ...props.phData,
                metis: {
                    ...props.phData.metis,
                    metamodels: [
                        ...props.phData.metis.metamodels.slice(0, mmindex),     
                        metamodelff,
                        ...props.phData.metis.metamodels.slice(mmindex + 1, props.phData.metis.metamodels.length),
                    ],
                    models: props.phData.metis.models,   
                },
            }, 
        };
        if (debug) console.log('205 ReadModelFromFile', data);
        
        props.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
    };
    reader.readAsText(e.target.files[0])
  }


