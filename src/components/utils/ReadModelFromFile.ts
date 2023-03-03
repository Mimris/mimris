
// @ts-nocheck

import { loadToStorePhdata } from "../../actions/actions"

const debug = false

export const ReadModelFromFile = async (props, dispatch, e) => { // Read Project from file
    e.preventDefault()
    const reader = new FileReader()
    reader.fileName = '' // reset fileName
    reader.fileName = (e.target.files[0]?.name)
    if (debug) console.log('13 ReadModelFromFile', reader.fileName)
    if (!reader.fileName) return null
    reader.onload = async (e) => { 
        const text = (e.target.result)
        const modelff = JSON.parse(text)
        const filename = reader.fileName 

        let data = {}
        let modelffmetamodels = modelff.metamodels || []
        let modelffmodelviews = modelff.modelviews || []
        let modelffmodels = modelff.models || []
        let modelffobjects = modelff.objects || []
        let modelffrelships = modelff.relships || []

        //   alert(text)
        if (debug) console.log('21 ReadModelFromFile', props.phFocus.focusModel.id);
        if (debug) console.log('22 ReadModelFromFile', props, modelff);
    
        let mindex = props.phData?.metis?.models?.findIndex(m => m.id === modelff?.id) // current model index
        let mlength = props.phData?.metis?.models.length
        console.log('26 ReadModelFromFile', mindex, mlength, modelff, modelff?.id, props, props.phData?.metis?.models[mindex]?.id)

        // ---------------------  load Project model files ---------------------
        console.log('29 ReadModelFromFile',  props, modelff)

        if (modelff.phData) { // if modelff has phData, then it is a project file
            if (debug) console.log('33 ReadModelFromFile',  props, modelff)    
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
            if (debug) console.log('48 ReadModelFromFile',  filename, modelff, props)
            if (!modelff.metamodels || !modelff.modelviews || !modelff.objects || !modelff.relships) {
                alert('This is not a valid Modelview file! (it contains no Metamodels, Modelviews and Mbjects)')
                return null 
            }
            let fmindex = props.phData?.metis?.models?.findIndex(m => m.id === props.phFocus.focusModel?.id) // current focusmodel index
            let mvindex, mvlength
            mvindex = props.phData?.metis?.models[fmindex]?.modelviews.findIndex(mv => mv.id === modelff.modelview?.id) // current modelview index
            mvlength = props.phData?.metis?.models[fmindex]?.modelviews?.length;
            if (mvindex < 0) { mvindex = mvlength } // mvindex = -1, i.e.  not fond, which means adding a new modelview
            const tmpmv = props.phData.metis.models[fmindex].modelviews
            if (mvindex >= 0) { // if modelview exist, then add additional objectviews to the existing modelview
                modelff.modelview.objectviews.forEach(ov => {
                    const ovindex = tmpmv[mvindex].objectviews.findIndex(ovv => ovv.id === ov.id)
                    if (ovindex < 0) { tmpmv[mvindex].objectviews.push(ov) } // if objectview does not exist, then add it to the existing modelview
                })
            
            const r = window.confirm("This Modelview import will also add the corresponding Metamodel and Objects. Click OK to continue?")
            if (r === false) { return null } // if user clicks cancel, then do nothing

            // if modelview already exist in props.phData.metis.models[fmindex].modelviews, then add additional obectviews to the existing modelview
         

            } else { // if modelview does not exist, then add it to props.phData.metis.models[fmindex].modelviews
                tmpmv.push(modelff.modelview)
            }

 
            //  if object already exist in props.phData.metis.models[fmindex].objects, then remove it from props.phData.metis.models[fmindex].objects 
            const oindex = props.phData.metis.models[fmindex].objects.findIndex(o => o.id === modelff.objects[0].id)
            const tmpobj = props.phData.metis.models[fmindex].objects
            if (oindex >= 0) { tmpobj.splice(oindex, 1) } // if object exist, then remove it from props.phData.metis.models[fmindex].objects, i.e. the object will be replaced by the new object

            //  if relationship already exist in props.phData.metis.models[fmindex].relships, then remove it from props.phData.metis.models[fmindex].relships 
            const rindex = props.phData.metis.models[fmindex].relships.findIndex(r => r.id === modelff.relships[0].id)
            const tmprels = props.phData.metis.models[fmindex].relships
            if (rindex >= 0) { tmprels.splice(rindex, 1) } // if relationship exist, then remove it from props.phData.metis.models[fmindex].relships, i.e. the relationship will be replaced by the new relationship
         
            if (debug) console.log('69 ReadModelFromFile', tmpobj, modelffobjects, modelffrelships, props.phData.metis.models[fmindex].objects);  
            if (debug) console.log('80 ReadModelFromFile', modelffmetamodels, modelffmodelviews);

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
                                objects: [
                                    ...tmpobj,
                                    ...modelffobjects
                                ],
                                relships: [
                                    ...tmprels,
                                    ...modelffrelships
                                ],
                                modelviews: [ 
                                    ...props.phData.metis.models[fmindex]?.modelviews,  
                                    ...tmpmv
                                ],
                            },
                            ...props.phData.metis.models?.slice(fmindex + 1, mlength),
                        ],
                    },
                }, 
            };
            if (debug) console.log('101 ReadModelFromFile', data);
  
        } else if (filename.includes('_MO')) { // then it is a model file           
            
            // if model already exist in props.phData.metis.models, then remove it from props.phData.metis.models
            const mindex = props.phData.metis.models.findIndex(m => m.id === modelff.id)
            const tmpmodel = props.phData.metis.models
            if (mindex >= 0) {   // if model exist, then remove it from props.phData.metis.models, i.e. the model will be replaced by the new model
                alert("Model already exists! Delete current model and try again!")
                return null
            } else { // mindex = -1, i.e.  not fond, which means adding a new model
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
            let  mmindex = props.phData?.metis?.metamodels?.findIndex(m => m.id === modelff?.id) // current model index
            const mmlength = props.phData?.metis?.metamodels.length
            if ( mmindex < 0) { mmindex = mmlength } // ovindex = -1, i.e.  not fond, which means adding a new model
            if (debug) console.log('108 ReadModelFromFile', metamodelff, mmindex, mmlength);
            data = {
                phData: {
                    ...props.phData,
                    metis: {
                        ...props.phData.metis,
                        metamodels: [ 
                            ...props.phData.metis.metamodels?.slice(0, mindex),  
                            {  
                                ...props.phData.metis.metamodels[mindex],  
                                modelff
                            },
                            ...props.phData.metis.metamodels?.slice(mindex + 1, mlength),
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


