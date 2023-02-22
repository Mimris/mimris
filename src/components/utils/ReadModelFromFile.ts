
// @ts-nocheck

import { loadToStorePhdata } from "../../actions/actions"

const debug = false

export const ReadModelFromFile = async (props, dispatch, e) => { // Read Project from file
    e.preventDefault()
    const reader = new FileReader()
    reader.fileName = '' // reset fileName
    reader.fileName = (e.target.files[0]?.name)
    console.log('13 ReadModelFromFile', reader.fileName)
    if (!reader.fileName) return null
    reader.onload = async (e) => { 
        const text = (e.target.result)
        const modelff = JSON.parse(text)
        const filename = reader.fileName 

        //   alert(text)
        if (debug) console.log('21 ReadModelFromFile', props.phFocus.focusModel.id);
        if (!debug) console.log('22 ReadModelFromFile', props, modelff);
    
        let mindex = props.phData?.metis?.models?.findIndex(m => m.id === modelff?.id) // current model index
        let mlength = props.phData?.metis?.models.length
        console.log('26 ReadModelFromFile', mindex, mlength, modelff, modelff?.id, props, props.phData?.metis?.models[mindex]?.id)

        // ---------------------  load Project model files ---------------------
        console.log('29 ReadModelFromFile',  props, modelff)

        let data = {}
        if (modelff.phData) { // if modelff has phData, then it is a project file
            console.log('33 ReadModelFromFile',  props, modelff)    
            data = {
                phData:   modelff.phData,
                phFocus:  modelff.phFocus,
                phUser:   modelff.phUser,
                phSource: filename,
            }

            if (!modelff.phFocus.focusModel) { // if modelff has no focusModel, then set it to the first model
                modelff.phFocus.focusModel= {id: modelff.phData.metis.models[0].id, name: modelff.phData.metis.models[0].name}
            }
            if (modelff.phFocus.focusModelView) { // if modelff has no focusModelView, then set it to the first modelview
                modelff.phFocus.focusModelView= {id: modelff.phData.metis.models[0].modelviews[0].id, name: modelff.phData.metis.models[0].modelviews[0].name}
            }
        } else if (filename.includes('_MV')) { // if modelff is a modelview, then it is a modelview file with objects and metamodel
            console.log('48 ReadModelFromFile',  filename, modelff, props)
            let fmindex = props.phData?.metis?.models?.findIndex(m => m.id === props.phFocus.focusModel?.id) // current focusmodel index
            let mvindex, mvlength
            mvindex = props.phData?.metis?.models[fmindex]?.modelviews.findIndex(mv => mv.id === modelff.modelview?.id) // current modelview index
            mvlength = props.phData?.metis?.models[fmindex]?.modelviews?.length;
            if (mvindex < 0) { mvindex = mvlength } // mvindex = -1, i.e.  not fond, which means adding a new modelview
            
            let modelffmetamodels, modelffmodelviews, modelffobjects = []
            if (modelff.metamodels) { // if modelff has metamodels, then it is a modelview file with objects and metamodel

                const r = window.confirm("This modelview import will also add the corresponding Metamodel and objects. Click OK if you want to continue?")
                // const r = window.confirm("Model already exists, do you want to replace it?")
                if (r === false) { return null } // if user clicks cancel, then do nothing
                // check if metamodel already exist
                // const mmindex = props.phData?.metis?.metamodels?.findIndex(m => m.id === modelff?.metamodels[0]?.id) // current model index
                modelffmetamodels = modelff.metamodels // if metamodel does not exist, then add it
                modelffobjects = modelff.objects // add objects
                modelffmodelviews = modelff.modelviews // add modelview
            } 

            if (!debug) console.log('69 ReadModelFromFile', modelffmetamodels, modelffmodelviews, modelffobjects);

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
                            ...props.phData.metis.models?.slice(0, fmindex),  
                            {  
                                ...props.phData.metis.models[fmindex],
                                // add objects wich exist in modelview
                                objects: [
                                    ...props.phData.metis.models[fmindex].objects,
                                    ...modelffobjects
                                ],
                                modelviews: [ 
                                    ...props.phData.metis.models[fmindex]?.modelviews,  
                                    modelffmodelviews,
                                ],
                            },
                            ...props.phData.metis.models?.slice(fmindex + 1, mlength),
                        ],
                    },
                }, 
            };
            if (!debug) console.log('101 ReadModelFromFile', data);

        } else if (filename.includes('_MM')) { // if filename contains _MM, then it is a metamodel file
            let  mmindex = props.phData?.metis?.metamodels?.findIndex(m => m.id === modelff?.id) // current model index
            const mmlength = props.phData?.metis?.metamodels.length
            if ( mmindex < 0) { mmindex = mmlength } // ovindex = -1, i.e.  not fond, which means adding a new model
            if (debug) console.log('108 ReadModelFromFile', metamodelff, mmindex, mmlength);
            // data = {
            //     phData: {
            //         ...props.phData,
            //         metis: {
            //             ...props.phData.metis,
            //             metamodels: [ 
            //                 ...props.phData.metis.metamodels?.slice(0, mindex),  
            //                 {  
            //                     ...props.phData.metis.metamodels[mindex],  
            //                     modelff
            //                 },
            //                 ...props.phData.metis.metamodels?.slice(mindex + 1, mlength),
            //             ],
            //         },
            //     }, 
            // };    
        } else if (filename.includes('_MO')) { // then it is a model file            console.log('116 SaveModelToFile', mindex, mlength, modelff?.id, props.phData?.metis?.models[mindex]?.id)

            const r = window.confirm("Model already exists! Existing: "+props.phData?.metis?.models[mindex]?.name+" New: "+modelff?.name+" Do you want to replace (overwrite it)?")
            // const r = window.confirm("Model already exists, do you want to replace it?")
            if (r === false) { //  add model but change model id
                modelff.id = modelff.id + mlength
                mindex = mlength
                console.log('132 ReadModelFromFile', mindex, mlength, modelff?.id, props.phData?.metis?.models[mindex]?.id)
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
        } else {
            console.log('ReadModelFromFile: Unknown file type')
            alert('ReadModelFromFile: Unknown file type')
        }
        if (debug) console.log('154 ReadModelFromFile', data);      
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
        if (debug) console.log('170 ReadModelFromFile', props);
        let  mmindex = props.phData?.metis?.metamodels?.findIndex(m => m.id === metamodelff?.id) // current model index
        const mmlength = props.phData?.metis?.metamodels.length
        if ( mmindex < 0) { mmindex = mmlength } // ovindex = -1, i.e.  not fond, which means adding a new model
        if (debug) console.log('174 ReadModelFromFile', metamodelff, mmindex, mmlength);
        
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
        if (debug) console.log('190 ReadModelFromFile', data);
        
        props.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
    };
    reader.readAsText(e.target.files[0])
  }


